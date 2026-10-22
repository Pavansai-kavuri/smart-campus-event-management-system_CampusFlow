import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
  User,
  Venue,
  Event,
  VenueReservation,
  Registration,
  Attendance,
  Certificate,
  Notification,
  Announcement,
  Feedback,
  SavedEvent,
  AuditLog,
} from '../models/index.js';

export async function runSeed(): Promise<void> {
  const passwordHash = await bcrypt.hash('CampusFlow@2026', 10);

  // 0. Remove old Harshitha Lakshmi Kumari demo account completely
  await User.deleteMany({
    email: {
      $in: [
        'harshitha@campusflow.edu',
        'harshithalakshmikumari@gmail.com',
        'harshitha.kumari@campusflow.edu',
      ],
    },
  });

  // 1. Upsert Demo Users (Pavan Sai Ram Likhith, Organizer, Admin)
  const student = await User.findOneAndUpdate(
    {
      $or: [
        { email: 'Vu.241FA04312@gmail.com' },
        { email: 'vu.241fa04312@gmail.com' },
        { rollNumber: '241FA04312' },
      ],
    },
    {
      $set: {
        name: 'Pavan Sai Ram Likhith',
        email: 'Vu.241FA04312@gmail.com',
        role: 'STUDENT',
        rollNumber: '241FA04312',
        department: 'Department of Computer Science and Engineering',
        yearOfStudy: 3,
        avatar: 'avatar-scholar',
        bio: '3rd Year CSE Undergraduate passionate about AI systems, UI/UX design sprints, and campus hackathons.',
        interests: ['Tech', 'Workshop', 'Competition', 'Cultural', 'Career'],
        isActive: true,
        isDemo: true,
      },
      $setOnInsert: {
        passwordHash,
        themePreference: 'system',
      },
    },
    { upsert: true, new: true }
  );

  const organizer = await User.findOneAndUpdate(
    { email: 'vikram.mehta@campusflow.edu' },
    {
      $setOnInsert: {
        name: 'Prof. Vikram Mehta',
        email: 'vikram.mehta@campusflow.edu',
        passwordHash,
        role: 'ORGANIZER',
        rollNumber: 'FAC-CSE-108',
        department: 'School of Computing & Innovation',
        yearOfStudy: 4,
        avatar: 'avatar-innovator',
        bio: 'Faculty Lead for CampusFlow Innovation Hub & Annual TechFest.',
        interests: ['Tech', 'Workshop', 'Competition'],
        themePreference: 'system',
        isActive: true,
        isDemo: true,
      },
    },
    { upsert: true, new: true }
  );

  const admin = await User.findOneAndUpdate(
    { email: 'dean.aaravind@campusflow.edu' },
    {
      $setOnInsert: {
        name: 'Dr. Aaravind Krishnan',
        email: 'dean.aaravind@campusflow.edu',
        passwordHash,
        role: 'ADMIN',
        rollNumber: 'ADM-001',
        department: 'Office of the Dean — Student Affairs',
        yearOfStudy: 4,
        avatar: 'avatar-leader',
        bio: 'Dean of Student Affairs & Campus Scheduling Governance.',
        interests: ['Academic', 'Cultural', 'Tech'],
        themePreference: 'system',
        isActive: true,
        isDemo: true,
      },
    },
    { upsert: true, new: true }
  );

  const peerStudentsData = [
    {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@campusflow.edu',
      rollNumber: '241FA04313',
      department: 'Computer Science & Engineering',
      yearOfStudy: 3,
      interests: ['Tech', 'Competition', 'Sports'],
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@campusflow.edu',
      rollNumber: '241FA04345',
      department: 'Electronics & Communication',
      yearOfStudy: 2,
      interests: ['Cultural', 'Workshop', 'Design'],
    },
    {
      name: 'Kabir Verma',
      email: 'kabir.verma@campusflow.edu',
      rollNumber: '241FA04290',
      department: 'Artificial Intelligence & Data Science',
      yearOfStudy: 4,
      interests: ['Tech', 'Career', 'Academic'],
    },
  ];

  const peerStudents = [];
  for (const st of peerStudentsData) {
    const doc = await User.findOneAndUpdate(
      { email: st.email },
      {
        $setOnInsert: {
          ...st,
          passwordHash,
          role: 'STUDENT',
          isActive: true,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
    peerStudents.push(doc);
  }

  // 2. Upsert Venues
  const venuesSpec = [
    {
      code: 'AUD-MAIN',
      name: 'Grand Convocation Auditorium',
      building: 'Heritage Academic Block A',
      floor: 'Ground Level',
      capacity: 600,
      amenities: ['Dolby Line Array Audio', '4K LED Stage Wall', 'Green Rooms', 'High-Density Wi-Fi 6E'],
      setupBufferMinutes: 45,
      cleanupBufferMinutes: 45,
    },
    {
      code: 'DES-STUDIO-B',
      name: 'Innovation Design Studio B',
      building: 'School of Architecture & Design',
      floor: '2nd Floor',
      capacity: 120,
      amenities: ['Interactive Smartboards', 'Modular Workbenches', 'Prototyping Kit', 'Natural Skylights'],
      setupBufferMinutes: 30,
      cleanupBufferMinutes: 30,
    },
    {
      code: 'AMP-OPEN',
      name: 'Open-Air Heritage Amphitheater',
      building: 'Central Campus Commons',
      floor: 'Outdoor Plaza',
      capacity: 850,
      amenities: ['Concert Lighting Rig', 'Acoustic Shell', 'Festival Power Grid'],
      setupBufferMinutes: 60,
      cleanupBufferMinutes: 60,
    },
    {
      code: 'LAB-TURING',
      name: 'Turing AI & Innovation Lab',
      building: 'Engineering Research Complex',
      floor: '3rd Floor',
      capacity: 200,
      amenities: ['Dual-Monitor Workstations', 'Gigabit Fiber', '24h Espresso Bar', 'Whiteboard Walls'],
      setupBufferMinutes: 30,
      cleanupBufferMinutes: 30,
    },
    {
      code: 'SEM-SENATE',
      name: 'Senate Executive Seminar Hall',
      building: 'Administration & Research Wing',
      floor: '1st Floor',
      capacity: 180,
      amenities: ['Lecture Capture System', 'Podium Microphone', 'Video Conferencing'],
      setupBufferMinutes: 20,
      cleanupBufferMinutes: 20,
    },
  ];

  const venueMap: Record<string, any> = {};
  for (const v of venuesSpec) {
    const doc = await Venue.findOneAndUpdate(
      { code: v.code },
      {
        $setOnInsert: {
          ...v,
          isActive: true,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
    venueMap[v.code] = doc;
  }

  // Relative dates so events are always upcoming/consistent around current time
  const now = new Date();
  const daysFromNow = (days: number, hour = 10, minute = 0) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // 3. Upsert Reference & Campus Events
  const eventsSpec = [
    {
      code: 'CF-2026-TECHFEST',
      title: 'TECHFEST 2026',
      subtitle: 'Annual Flagship Autonomous Systems, AI & Next-Gen Engineering Summit',
      description:
        'Experience CampusFlow University’s flagship technology exposition featuring keynote sessions from research pioneers, live autonomous robotics demonstrations, neural interface showcases, and inter-university technical paper presentations.',
      category: 'Tech' as const,
      venue: venueMap['AUD-MAIN'],
      startDate: daysFromNow(4, 9, 30),
      endDate: daysFromNow(4, 17, 30),
      registrationDeadline: daysFromNow(3, 23, 59),
      capacity: 500,
      registeredCount: 342,
      attendedCount: 0,
      coverImage: '/images/events/techfest-2026.jpg',
      status: 'APPROVED' as const,
      featured: true,
      tags: ['Tech', 'AI', 'Robotics', 'Flagship'],
    },
    {
      code: 'CF-2026-DESIGNSPRINT',
      title: 'Design Sprint',
      subtitle: 'Human-Centered Product Architecture & Interactive Prototyping Studio',
      description:
        'An intensive hands-on product design workshop where interdisciplinary student teams move from problem framing to high-fidelity interactive prototypes in a single afternoon, mentored by senior UX architects.',
      category: 'Workshop' as const,
      venue: venueMap['DES-STUDIO-B'],
      startDate: daysFromNow(6, 14, 0),
      endDate: daysFromNow(6, 18, 30),
      registrationDeadline: daysFromNow(5, 20, 0),
      capacity: 100,
      registeredCount: 84,
      attendedCount: 0,
      coverImage: '/images/events/design-sprint.jpg',
      status: 'APPROVED' as const,
      featured: true,
      tags: ['Workshop', 'UI/UX', 'Design', 'Product'],
    },
    {
      code: 'CF-2026-CULTURALNIGHT',
      title: 'Cultural Night',
      subtitle: 'Symphony Under the Stars — Annual Heritage Music, Dance & Arts Gala',
      description:
        'Celebrate artistic expression across campus at the Open-Air Heritage Amphitheater. Featuring classical fusion ensembles, contemporary choreography, acoustic sets, and curated culinary stalls under warm twilight lanterns.',
      category: 'Cultural' as const,
      venue: venueMap['AMP-OPEN'],
      startDate: daysFromNow(9, 18, 0),
      endDate: daysFromNow(9, 22, 30),
      registrationDeadline: daysFromNow(8, 22, 0),
      capacity: 800,
      registeredCount: 615,
      attendedCount: 0,
      coverImage: '/images/events/cultural-night.jpg',
      status: 'APPROVED' as const,
      featured: true,
      tags: ['Cultural', 'Music', 'Festival', 'Arts'],
    },
    {
      code: 'CF-2026-HACKATHON',
      title: 'Hackathon',
      subtitle: '36-Hour Smart Campus & Sustainable AI Engineering Challenge',
      description:
        'Form a squad of up to 4 builders to architect real-world solutions in climate tech, campus intelligence, and decentralized security. Includes API credits, midnight espresso bar, and ₹1,50,000 in fellowship grants.',
      category: 'Competition' as const,
      venue: venueMap['LAB-TURING'],
      startDate: daysFromNow(12, 10, 0),
      endDate: daysFromNow(13, 18, 0),
      registrationDeadline: daysFromNow(10, 23, 59),
      capacity: 180,
      registeredCount: 156,
      attendedCount: 0,
      coverImage: '/images/events/hackathon.jpg',
      status: 'APPROVED' as const,
      featured: true,
      tags: ['Competition', 'Hackathon', 'Coding', 'Tech'],
    },
    {
      code: 'CF-2026-CLOUDWORKSHOP',
      title: 'Cloud & Distributed Systems Masterclass',
      subtitle: 'Production Kubernetes, Zero-Trust APIs & High-Availability Databases',
      description:
        'Completed hands-on engineering workshop covering distributed consensus, MongoDB replica sets, and container orchestration with live cluster labs.',
      category: 'Workshop' as const,
      venue: venueMap['SEM-SENATE'],
      startDate: daysFromNow(-7, 10, 0),
      endDate: daysFromNow(-7, 16, 0),
      registrationDeadline: daysFromNow(-8, 23, 59),
      capacity: 150,
      registeredCount: 138,
      attendedCount: 129,
      coverImage: '/images/events/techfest-2026.jpg',
      status: 'COMPLETED' as const,
      featured: false,
      tags: ['Workshop', 'Cloud', 'Tech', 'Backend'],
    },
    {
      code: 'CF-2026-AISYMPOSIUM',
      title: 'Quantum & Generative AI Colloquium',
      subtitle: 'Research Colloquium on Foundation Models & Edge Inference',
      description:
        'Completed academic colloquium with faculty and doctoral researchers exploring multimodal reasoning, model distillation, and verifiable AI safety.',
      category: 'Academic' as const,
      venue: venueMap['SEM-SENATE'],
      startDate: daysFromNow(-14, 11, 0),
      endDate: daysFromNow(-14, 16, 30),
      registrationDeadline: daysFromNow(-15, 23, 59),
      capacity: 160,
      registeredCount: 145,
      attendedCount: 136,
      coverImage: '/images/events/design-sprint.jpg',
      status: 'COMPLETED' as const,
      featured: false,
      tags: ['Academic', 'AI', 'Research', 'Tech'],
    },
    {
      code: 'CF-2026-CAREERCONCLAVE',
      title: 'Global Engineering & Product Career Conclave',
      subtitle: 'Recruiter Roundtables, Portfolio Reviews & Fellowship Interviews',
      description:
        'Connect directly with engineering leaders and university alumni for internship mentorship, resume critiques, and live system design mock interviews.',
      category: 'Career' as const,
      venue: venueMap['AUD-MAIN'],
      startDate: daysFromNow(16, 10, 0),
      endDate: daysFromNow(16, 17, 0),
      registrationDeadline: daysFromNow(14, 23, 59),
      capacity: 450,
      registeredCount: 210,
      attendedCount: 0,
      coverImage: '/images/events/techfest-2026.jpg',
      status: 'APPROVED' as const,
      featured: false,
      tags: ['Career', 'Internships', 'Alumni'],
    },
    {
      code: 'CF-2026-FINTECHSUMMIT',
      title: 'FinTech & Algorithmic Trading Symposium',
      subtitle: 'Quantitative Market Microstructure & Low-Latency Systems',
      description:
        'Awaiting administrative approval: Full-day symposium on quantitative finance, order-book simulation, and risk modeling hosted by the Finance & Computing Club.',
      category: 'Academic' as const,
      venue: venueMap['SEM-SENATE'],
      startDate: daysFromNow(19, 10, 30),
      endDate: daysFromNow(19, 16, 30),
      registrationDeadline: daysFromNow(17, 23, 59),
      capacity: 150,
      registeredCount: 0,
      attendedCount: 0,
      coverImage: '/images/events/hackathon.jpg',
      status: 'PENDING_APPROVAL' as const,
      featured: false,
      tags: ['Academic', 'FinTech', 'Career'],
    },
  ];

  const eventMap: Record<string, any> = {};
  for (const ev of eventsSpec) {
    const doc = await Event.findOneAndUpdate(
      { code: ev.code },
      {
        $setOnInsert: {
          code: ev.code,
          title: ev.title,
          subtitle: ev.subtitle,
          description: ev.description,
          category: ev.category,
          organizerId: organizer._id,
          organizerName: organizer.name,
          organizerDepartment: organizer.department,
          venueId: ev.venue._id,
          venueName: `${ev.venue.name}, ${ev.venue.building}`,
          startDate: ev.startDate,
          endDate: ev.endDate,
          registrationDeadline: ev.registrationDeadline,
          capacity: ev.capacity,
          registeredCount: ev.registeredCount,
          waitlistCount: 0,
          attendedCount: ev.attendedCount,
          eligibility: {
            departments: [],
            years: [],
            openToAll: true,
          },
          coverImage: ev.coverImage,
          status: ev.status,
          featured: ev.featured,
          tags: ev.tags,
          signatoryName: 'Dr. Aaravind Krishnan',
          signatoryTitle: 'Dean of Student Affairs, CampusFlow University',
          approvedBy: ev.status === 'APPROVED' || ev.status === 'COMPLETED' ? admin._id : undefined,
          approvedAt: ev.status === 'APPROVED' || ev.status === 'COMPLETED' ? new Date() : undefined,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
    eventMap[ev.code] = doc;

    // Upsert corresponding VenueReservation
    const setupMs = (ev.venue.setupBufferMinutes || 30) * 60 * 1000;
    const cleanupMs = (ev.venue.cleanupBufferMinutes || 30) * 60 * 1000;
    await VenueReservation.findOneAndUpdate(
      { eventId: doc._id },
      {
        $setOnInsert: {
          venueId: ev.venue._id,
          eventId: doc._id,
          requestedBy: organizer._id,
          startTime: ev.startDate,
          endTime: ev.endDate,
          bufferStart: new Date(ev.startDate.getTime() - setupMs),
          bufferEnd: new Date(ev.endDate.getTime() + cleanupMs),
          status: ev.status === 'PENDING_APPROVAL' ? 'PENDING' : 'CONFIRMED',
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 4. Upsert Registrations for Student (Pavan Sai Ram Likhith) & Peer Students
  const studentRegistrations = [
    {
      event: eventMap['CF-2026-TECHFEST'],
      status: 'REGISTERED' as const,
      qrToken: 'CFPASS-PAVAN-TECHFEST2026',
    },
    {
      event: eventMap['CF-2026-DESIGNSPRINT'],
      status: 'REGISTERED' as const,
      qrToken: 'CFPASS-PAVAN-DESIGNSPRINT',
    },
    {
      event: eventMap['CF-2026-CLOUDWORKSHOP'],
      status: 'ATTENDED' as const,
      qrToken: 'CFPASS-PAVAN-CLOUD2026',
      checkedInAt: daysFromNow(-7, 10, 15),
    },
    {
      event: eventMap['CF-2026-AISYMPOSIUM'],
      status: 'ATTENDED' as const,
      qrToken: 'CFPASS-PAVAN-AISYMP2026',
      checkedInAt: daysFromNow(-14, 11, 5),
    },
  ];

  const regDocs: Record<string, any> = {};
  for (const r of studentRegistrations) {
    const regDoc = await Registration.findOneAndUpdate(
      { studentId: student._id, eventId: r.event._id },
      {
        $setOnInsert: {
          studentId: student._id,
          eventId: r.event._id,
          status: r.status,
          qrToken: r.qrToken,
          registeredAt: daysFromNow(-16, 12, 0),
          checkedInAt: r.checkedInAt,
          reminderSent: true,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
    regDocs[r.event.code] = regDoc;

    if (r.status === 'ATTENDED') {
      await Attendance.findOneAndUpdate(
        { eventId: r.event._id, studentId: student._id },
        {
          $setOnInsert: {
            registrationId: regDoc._id,
            eventId: r.event._id,
            studentId: student._id,
            scannedBy: organizer._id,
            method: 'QR_SCAN',
            checkedInAt: r.checkedInAt || new Date(),
            isDemo: true,
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  // Register peer students for TECHFEST 2026 & Hackathon so Organizer QR Scanner has extra scannable passes
  for (let i = 0; i < peerStudents.length; i++) {
    const peer = peerStudents[i];
    await Registration.findOneAndUpdate(
      { studentId: peer._id, eventId: eventMap['CF-2026-TECHFEST']._id },
      {
        $setOnInsert: {
          studentId: peer._id,
          eventId: eventMap['CF-2026-TECHFEST']._id,
          status: 'REGISTERED',
          qrToken: `CFPASS-PEER0${i + 1}-TECHFEST2026`,
          registeredAt: daysFromNow(-3, 15, 0),
          reminderSent: false,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 5. Upsert Digital Certificates for Student's Completed Events
  const certsSpec = [
    {
      certificateCode: 'CF2026TEF12345',
      event: eventMap['CF-2026-TECHFEST'],
      reg: regDocs['CF-2026-TECHFEST'],
      eventTitle: 'TECHFEST 2026',
      venueName: 'Main Auditorium, Apex Central Campus',
      completionDate: new Date('2026-10-25T17:30:00.000Z'),
    },
    {
      certificateCode: 'CFCERT-2026-PAVAN01',
      event: eventMap['CF-2026-CLOUDWORKSHOP'],
      reg: regDocs['CF-2026-CLOUDWORKSHOP'],
      eventTitle: 'Cloud & Distributed Systems Masterclass',
      venueName: 'Senate Executive Seminar Hall, Apex Campus',
      completionDate: daysFromNow(-7, 16, 0),
    },
    {
      certificateCode: 'CFCERT-2026-PAVAN02',
      event: eventMap['CF-2026-AISYMPOSIUM'],
      reg: regDocs['CF-2026-AISYMPOSIUM'],
      eventTitle: 'Quantum & Generative AI Colloquium',
      venueName: 'Senate Executive Seminar Hall, Apex Campus',
      completionDate: daysFromNow(-14, 16, 30),
    },
  ];

  for (const c of certsSpec) {
    const hash = crypto
      .createHash('sha256')
      .update(`${c.certificateCode}:${student._id}:${c.event._id}`)
      .digest('hex');

    await Certificate.findOneAndUpdate(
      { certificateCode: c.certificateCode },
      {
        $set: {
          participantName: 'Pavan Sai Ram Likhith',
          studentDepartment: 'Department of Computer Science and Engineering',
          eventTitle: c.eventTitle || c.event.title,
          eventCategory: c.event.category,
          venueName: c.venueName || c.event.venueName,
          completionDate: c.completionDate || c.event.endDate,
          signatoryName: 'Dr. Aaravind Krishnan',
          signatoryTitle: 'Dean, Student Affairs, Apex University',
          institutionName: 'APEX UNIVERSITY OF TECHNOLOGY & SCIENCE',
          status: 'ISSUED',
        },
        $setOnInsert: {
          certificateCode: c.certificateCode,
          eventId: c.event._id,
          studentId: student._id,
          registrationId: c.reg?._id || student._id,
          issuedBy: organizer._id,
          verificationHash: hash,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 6. Upsert Saved Events (Bookmarks & Reminders) for Student
  const savedCodes = ['CF-2026-TECHFEST', 'CF-2026-CULTURALNIGHT', 'CF-2026-HACKATHON'];
  for (const code of savedCodes) {
    const ev = eventMap[code];
    await SavedEvent.findOneAndUpdate(
      { userId: student._id, eventId: ev._id },
      {
        $setOnInsert: {
          userId: student._id,
          eventId: ev._id,
          reminderSet: true,
          reminderMinutesBefore: 60,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 7. Upsert Notifications for Student
  const notificationsSpec = [
    {
      idempotencyKey: 'seed-notif-pavan-techfest',
      type: 'REGISTRATION_CONFIRMATION' as const,
      title: 'Registration Confirmed: TECHFEST 2026',
      message:
        'Your seat for TECHFEST 2026 at Grand Convocation Auditorium is confirmed. Your QR pass CFPASS-PAVAN-TECHFEST2026 is ready.',
      link: '/my-registrations',
      read: false,
    },
    {
      idempotencyKey: 'seed-notif-pavan-reminder-1',
      type: 'EVENT_REMINDER' as const,
      title: 'Upcoming Event Reminder: Design Sprint',
      message:
        'Design Sprint at Innovation Design Studio B is coming up soon. Review the workshop brief and bring your laptop.',
      link: '/my-registrations',
      read: false,
    },
    {
      idempotencyKey: 'seed-notif-pavan-cert-1',
      type: 'CERTIFICATE_ISSUED' as const,
      title: 'Certificate Issued: Cloud & Distributed Systems Masterclass',
      message:
        'Your official gold-embossed digital certificate (CFCERT-2026-PAVAN01) has been published and verified.',
      link: '/certificates',
      read: true,
    },
  ];

  for (const n of notificationsSpec) {
    await Notification.findOneAndUpdate(
      { idempotencyKey: n.idempotencyKey },
      {
        $setOnInsert: {
          userId: student._id,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link,
          read: n.read,
          idempotencyKey: n.idempotencyKey,
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 8. Upsert Campus Announcements
  const announcementsSpec = [
    {
      code: 'CF-ANN-2026-01',
      title: 'TECHFEST 2026 Keynote Speaker Lineup & QR Check-In Guidelines',
      content:
        'All registered students for TECHFEST 2026 are requested to carry their digital CampusFlow QR pass for express entry at the Grand Convocation Auditorium. Doors open 30 minutes prior to the keynote address.',
      category: 'Flagship Event',
      priority: 'URGENT' as const,
      targetAudience: 'ALL' as const,
      isPinned: true,
    },
    {
      code: 'CF-ANN-2026-02',
      title: 'New Digital Certificate Verification Portal Launched',
      content:
        'Students can now download high-resolution PDF certificates with embedded cryptographic verification IDs and share verifiable links directly on LinkedIn and academic portfolios.',
      category: 'Academic Records',
      priority: 'IMPORTANT' as const,
      targetAudience: 'ALL' as const,
      isPinned: true,
    },
    {
      code: 'CF-ANN-2026-03',
      title: 'Venue Buffer Policy for Student Club Organizers',
      content:
        'To ensure smooth transitions between campus events, the automated Venue Conflict Detector now enforces a 30-to-60 minute setup and cleanup buffer on all auditorium and studio reservations.',
      category: 'Governance',
      priority: 'NORMAL' as const,
      targetAudience: 'ORGANIZERS' as const,
      isPinned: false,
    },
  ];

  for (const a of announcementsSpec) {
    await Announcement.findOneAndUpdate(
      { code: a.code },
      {
        $setOnInsert: {
          ...a,
          authorId: admin._id,
          authorName: admin.name,
          publishedAt: daysFromNow(-2, 9, 0),
          readBy: [],
          isDemo: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  // 9. Upsert Student Feedback
  await Feedback.findOneAndUpdate(
    { eventId: eventMap['CF-2026-CLOUDWORKSHOP']._id, studentId: student._id },
    {
      $setOnInsert: {
        eventId: eventMap['CF-2026-CLOUDWORKSHOP']._id,
        studentId: student._id,
        rating: 5,
        organizationRating: 5,
        contentQualityRating: 5,
        venueRating: 5,
        comment:
          'Exceptional hands-on depth! The live distributed database failover demonstration and cluster architecture walkthrough were super clear.',
        wouldRecommend: true,
        isAnonymous: false,
        isDemo: true,
      },
    },
    { upsert: true, new: true }
  );

  // 10. Initial Audit Log entry if empty
  const auditCount = await AuditLog.countDocuments();
  if (auditCount === 0) {
    await AuditLog.create({
      actorId: admin._id,
      actorName: admin.name,
      actorRole: 'ADMIN',
      action: 'SYSTEM_SEED_INITIALIZED',
      targetType: 'System',
      details: { message: 'CampusFlow initial synthetic university dataset verified.' },
    });
  }

  console.log('[CampusFlow Seed] Safe upsert completed without overwriting existing records.');
}

export async function ensureSeedDataIfEmpty(): Promise<void> {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('[CampusFlow Seed] Empty database detected — initializing synthetic university data...');
    await runSeed();
  }
}

// Allow running directly via `npm run seed`
const isDirectExecution =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() === process.argv[1].toLowerCase();

if (isDirectExecution) {
  connectDatabase()
    .then(() => runSeed())
    .then(() => disconnectDatabase())
    .then(() => {
      console.log('[CampusFlow Seed] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[CampusFlow Seed] Failed:', err);
      process.exit(1);
    });
}
