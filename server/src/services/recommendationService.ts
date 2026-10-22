import { Event, Registration, SavedEvent, IUser } from '../models/index.js';

export interface RecommendedEventItem {
  event: any;
  score: number;
  matchPercentage: number;
  reasons: string[];
  engine: 'LOCAL_HEURISTIC_ENGINE';
}

export async function getRecommendedEventsForUser(
  user: IUser,
  limit = 6
): Promise<{
  engine: 'LOCAL_HEURISTIC_ENGINE';
  externalAiConfigured: boolean;
  recommendations: RecommendedEventItem[];
}> {
  const now = new Date();

  const [pastRegistrations, savedEvents, upcomingEvents] = await Promise.all([
    Registration.find({
      studentId: user._id,
      status: { $in: ['REGISTERED', 'ATTENDED', 'WAITLISTED'] },
    })
      .populate('eventId')
      .lean(),
    SavedEvent.find({ userId: user._id }).populate('eventId').lean(),
    Event.find({
      status: 'APPROVED',
      endDate: { $gte: now },
    })
      .sort({ startDate: 1 })
      .lean(),
  ]);

  const registeredEventIds = new Set(
    pastRegistrations
      .map((r: any) => String(r.eventId?._id || r.eventId))
      .filter(Boolean)
  );

  const savedEventIds = new Set(
    savedEvents.map((s: any) => String(s.eventId?._id || s.eventId)).filter(Boolean)
  );

  // Count historical category affinity
  const categoryCounts: Record<string, number> = {};
  for (const reg of pastRegistrations as any[]) {
    const cat = reg.eventId?.category;
    if (cat) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }
  for (const sav of savedEvents as any[]) {
    const cat = sav.eventId?.category;
    if (cat) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }

  const userInterests = new Set((user.interests || []).map((i) => i.toLowerCase()));

  const scored: RecommendedEventItem[] = [];

  for (const ev of upcomingEvents) {
    const evId = String(ev._id);
    if (registeredEventIds.has(evId)) {
      continue; // Already registered; recommend new events to discover
    }

    let score = 20; // Base score for active approved upcoming event
    const reasons: string[] = [];

    // 1. User explicit interest match (+30)
    if (userInterests.has(ev.category.toLowerCase())) {
      score += 30;
      reasons.push(`Matches your selected interest in ${ev.category}`);
    }

    // 2. Tag overlap with user interests (+15)
    const matchingTags = (ev.tags || []).filter((t: string) =>
      userInterests.has(t.toLowerCase())
    );
    if (matchingTags.length > 0) {
      score += 15;
      reasons.push(`Tagged with ${matchingTags.slice(0, 2).join(', ')}`);
    }

    // 3. Past registration / saved category affinity (+20)
    if (categoryCounts[ev.category]) {
      score += Math.min(20, categoryCounts[ev.category] * 10);
      reasons.push(
        `Similar to ${categoryCounts[ev.category]} ${ev.category} event(s) you engaged with`
      );
    }

    // 4. Saved/Bookmarked by user (+25)
    if (savedEventIds.has(evId)) {
      score += 25;
      reasons.push('Saved in your bookmarked events list');
    }

    // 5. Department / Year eligibility match (+15)
    const deptEligible =
      ev.eligibility?.openToAll ||
      !ev.eligibility?.departments?.length ||
      ev.eligibility.departments.includes(user.department);
    const yearEligible =
      ev.eligibility?.openToAll ||
      !ev.eligibility?.years?.length ||
      (user.yearOfStudy && ev.eligibility.years.includes(user.yearOfStudy));

    if (!deptEligible || !yearEligible) {
      continue; // Skip events the student is not eligible for
    } else if (
      ev.eligibility?.departments?.includes(user.department) &&
      !ev.eligibility?.openToAll
    ) {
      score += 15;
      reasons.push(`Tailored for ${user.department}`);
    } else {
      score += 8;
      reasons.push(`Open to ${user.department} students`);
    }

    // 6. Popularity & Trending velocity (+15)
    const fillRatio = ev.capacity > 0 ? ev.registeredCount / ev.capacity : 0;
    if (fillRatio >= 0.5 && fillRatio < 1) {
      score += 15;
      reasons.push(
        `Trending on campus (${Math.round(fillRatio * 100)}% seats claimed)`
      );
    } else if (ev.featured) {
      score += 12;
      reasons.push('Featured campus flagship event');
    }

    // 7. Seat availability bonus (+10 if seats still available before deadline)
    const spotsLeft = Math.max(0, ev.capacity - ev.registeredCount);
    if (spotsLeft > 0 && new Date(ev.registrationDeadline) > now) {
      score += 10;
      if (spotsLeft <= 25) {
        reasons.push(`Only ${spotsLeft} spots remaining before deadline`);
      }
    } else {
      score -= 20;
    }

    const matchPercentage = Math.min(99, Math.max(55, score));

    scored.push({
      event: {
        ...ev,
        isSaved: savedEventIds.has(evId),
        isRegistered: false,
      },
      score,
      matchPercentage,
      reasons: reasons.slice(0, 3),
      engine: 'LOCAL_HEURISTIC_ENGINE',
    });
  }

  scored.sort((a, b) => b.score - a.score);

  return {
    engine: 'LOCAL_HEURISTIC_ENGINE',
    externalAiConfigured: Boolean(process.env.AI_PROVIDER_API_KEY),
    recommendations: scored.slice(0, limit),
  };
}
