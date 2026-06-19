// Long-form legal/safety copy for the footer pages (Privacy, Terms, Safety).
// Kept OUT of lib/i18n/dictionary.ts on purpose: multi-paragraph legal prose
// would bloat the shared dictionary and clutter the copy editor. Still fully
// bilingual (en + he) so RTL + language switching work like everywhere else.
//
// ⚠️ Starter content — have legal counsel review before relying on it.
// Update CONTACT_EMAIL and GOVERNING_LAW to match your real details.

export const CONTACT_EMAIL = 'ofekbaram5@gmail.com'

export type Locale = 'en' | 'he'
export interface Section { h: string; p: string[] }
export interface Doc { title: string; updated: string; intro: string; sections: Section[] }
export type LegalKey = 'privacy' | 'terms' | 'safety'

export const legal: Record<LegalKey, Record<Locale, Doc>> = {
  privacy: {
    en: {
      title: 'Privacy Policy',
      updated: 'Last updated: June 19, 2026',
      intro:
        'WIA ("Who Is Around", "we", "us") is a live, location-based way to see and meet the people physically present at a venue. This policy explains what we collect, why, and the choices you have. We built WIA to be temporary and local by design — your presence is meant to disappear when you leave.',
      sections: [
        {
          h: 'Information we collect',
          p: [
            'Location (one-time): when you join a room we read your device location once to confirm you are physically within the venue’s geofence. We use it for that check only — we do not track you continuously and we do not store your precise coordinates afterward.',
            'Live selfie: the photo you capture at join. It is shown to other people at the same venue during your visit and is removed when your presence ends.',
            'Profile details: your name, age, gender, and an optional short status line.',
            'Account identity: your email, or — if you choose “Sign in with Google” — the email and basic profile Google shares with us. This is your persistent WIA identity across venues.',
            'Activity: your presence at a venue, the likes you send, matches, and chat messages.',
            'Technical data: basic device/browser information and cookies needed to keep you signed in.',
          ],
        },
        {
          h: 'How we use it',
          p: [
            'To verify you are actually at the venue and to place you in the right room.',
            'To show you to other people physically present at the same venue, and to power likes, matches, and chat.',
            'To send notifications you choose to enable (a new match or message).',
            'To keep your identity and matches across visits, and to keep the service safe and secure.',
          ],
        },
        {
          h: 'What other people can see',
          p: [
            'Only people physically present at the same venue can see your selfie, name, age, gender, and status — and only while you are there.',
            'People who are not at the venue cannot see you. Your presence is local to that room.',
            'Your email is never shown to other guests.',
          ],
        },
        {
          h: 'How long we keep it',
          p: [
            'Presence is temporary: it expires automatically (within a few hours) or when you leave the venue.',
            'Your selfie is tied to that presence and is removed when the presence ends.',
            'Your account identity, likes, and chat history persist so the experience works across visits — until you ask us to delete them.',
          ],
        },
        {
          h: 'Sharing and service providers',
          p: [
            'We do not sell your personal data.',
            'We rely on trusted providers who process data on our behalf: Supabase (database, file storage, authentication), Vercel (hosting), and Google (only if you choose Google sign-in).',
            'We may disclose information if required by law or to protect the safety of our users.',
          ],
        },
        {
          h: 'Your choices and rights',
          p: [
            'You can request access to, correction of, or deletion of your personal data at any time by contacting us.',
            'You can disable notifications from your browser or device settings.',
            `To exercise any of these rights, email us at ${CONTACT_EMAIL}.`,
          ],
        },
        {
          h: 'Age',
          p: ['WIA is for adults aged 18 and over. We do not knowingly collect data from anyone under 18.'],
        },
        {
          h: 'Changes and contact',
          p: [
            'We may update this policy from time to time; we will revise the date above when we do.',
            `Questions about your privacy? Contact us at ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
    he: {
      title: 'מדיניות פרטיות',
      updated: 'עודכן לאחרונה: 19 ביוני 2026',
      intro:
        'WIA ("מי נמצא סביבך", "אנחנו") היא דרך חיה ומבוססת-מיקום לראות ולהכיר את האנשים שנמצאים פיזית במקום מסוים. המדיניות הזו מסבירה מה אנחנו אוספים, למה, ואילו אפשרויות יש לכם. WIA בנויה להיות זמנית ומקומית — הנוכחות שלכם אמורה להיעלם ברגע שאתם עוזבים.',
      sections: [
        {
          h: 'איזה מידע אנחנו אוספים',
          p: [
            'מיקום (חד-פעמי): כשאתם מצטרפים לחדר אנחנו קוראים את מיקום המכשיר פעם אחת כדי לוודא שאתם נמצאים פיזית בתוך הגדר הווירטואלית של המקום. אנחנו משתמשים בו רק לבדיקה הזו — לא עוקבים אחריכם באופן רציף ולא שומרים את הקואורדינטות המדויקות שלכם אחר כך.',
            'סלפי חי: התמונה שאתם מצלמים בהצטרפות. היא מוצגת לאנשים אחרים באותו מקום במהלך הביקור ונמחקת כשהנוכחות שלכם מסתיימת.',
            'פרטי פרופיל: שם, גיל, מגדר, ומשפט סטטוס קצר (לא חובה).',
            'זהות החשבון: כתובת האימייל שלכם, או — אם בחרתם "התחברות עם Google" — האימייל ופרטי הפרופיל הבסיסיים ש-Google משתפת איתנו. זו הזהות הקבועה שלכם ב-WIA בכל המקומות.',
            'פעילות: הנוכחות שלכם במקום, הלייקים ששלחתם, מאצ׳ים, והודעות צ׳אט.',
            'מידע טכני: נתוני מכשיר/דפדפן בסיסיים ועוגיות הדרושות כדי לשמור אתכם מחוברים.',
          ],
        },
        {
          h: 'איך אנחנו משתמשים במידע',
          p: [
            'כדי לוודא שאתם באמת במקום ולשבץ אתכם בחדר הנכון.',
            'כדי להציג אתכם לאנשים אחרים שנמצאים פיזית באותו מקום, ולהפעיל לייקים, מאצ׳ים וצ׳אט.',
            'כדי לשלוח התראות שבחרתם להפעיל (מאצ׳ חדש או הודעה).',
            'כדי לשמור על הזהות והמאצ׳ים שלכם בין ביקורים, ולשמור על השירות בטוח ומאובטח.',
          ],
        },
        {
          h: 'מה אנשים אחרים רואים',
          p: [
            'רק אנשים שנמצאים פיזית באותו מקום יכולים לראות את הסלפי, השם, הגיל, המגדר והסטטוס שלכם — ורק כל עוד אתם שם.',
            'מי שלא נמצא במקום לא רואה אתכם. הנוכחות שלכם מקומית לחדר הזה.',
            'כתובת האימייל שלכם לעולם לא מוצגת לאורחים אחרים.',
          ],
        },
        {
          h: 'כמה זמן אנחנו שומרים',
          p: [
            'הנוכחות זמנית: היא פגה אוטומטית (תוך כמה שעות) או כשאתם עוזבים את המקום.',
            'הסלפי שלכם קשור לנוכחות הזו ונמחק כשהנוכחות מסתיימת.',
            'זהות החשבון, הלייקים והצ׳אטים נשמרים כדי שהחוויה תעבוד בין ביקורים — עד שתבקשו שנמחק אותם.',
          ],
        },
        {
          h: 'שיתוף וספקי שירות',
          p: [
            'אנחנו לא מוכרים את המידע האישי שלכם.',
            'אנחנו נעזרים בספקים מהימנים שמעבדים נתונים עבורנו: Supabase (מסד נתונים, אחסון קבצים, אימות), Vercel (אחסון האתר), ו-Google (רק אם בחרתם להתחבר עם Google).',
            'אנחנו עשויים למסור מידע אם נדרש על פי חוק או כדי להגן על בטיחות המשתמשים שלנו.',
          ],
        },
        {
          h: 'האפשרויות והזכויות שלכם',
          p: [
            'אתם יכולים לבקש בכל עת גישה למידע האישי שלכם, תיקון שלו או מחיקתו, בפנייה אלינו.',
            'אתם יכולים לכבות התראות דרך הגדרות הדפדפן או המכשיר.',
            `כדי לממש כל אחת מהזכויות האלה, כתבו לנו ל-${CONTACT_EMAIL}.`,
          ],
        },
        {
          h: 'גיל',
          p: ['WIA מיועדת לבגירים מגיל 18 ומעלה. איננו אוספים ביודעין מידע ממי שמתחת לגיל 18.'],
        },
        {
          h: 'שינויים ויצירת קשר',
          p: [
            'אנחנו עשויים לעדכן את המדיניות הזו מעת לעת; נעדכן את התאריך למעלה כשנעשה זאת.',
            `שאלות על הפרטיות שלכם? כתבו לנו ל-${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
  },

  terms: {
    en: {
      title: 'Terms of Service',
      updated: 'Last updated: June 19, 2026',
      intro:
        'These Terms govern your use of WIA. By scanning a WIA QR code and joining a room, you agree to them. If you do not agree, please do not use the service.',
      sections: [
        {
          h: 'Eligibility',
          p: [
            'You must be at least 18 years old to use WIA.',
            'You may only join a venue’s room when you are physically present at that venue.',
          ],
        },
        {
          h: 'The service',
          p: [
            'WIA shows you the people physically present at a participating venue right now, and lets you like, match, and chat with them.',
            'Presence is temporary and local: it ends when you leave the venue or after it expires. WIA is not a permanent social network.',
          ],
        },
        {
          h: 'Your account and identity',
          p: [
            'Your email or Google account is your WIA identity across venues. You are responsible for activity that happens under it.',
            'Keep your sign-in secure and let us know if you believe it has been misused.',
          ],
        },
        {
          h: 'Acceptable use',
          p: [
            'Be respectful. Harassment, hate speech, threats, stalking, and unwanted contact are not allowed.',
            'No impersonation, no fake or misleading profiles, and no using someone else’s photo — your selfie must be a real, live image of you.',
            'Do not post or send illegal, abusive, or sexually explicit content, and do not capture or share other people’s images to harass or expose them.',
            'Do not attempt to spoof your location, scrape the service, or interfere with its operation.',
          ],
        },
        {
          h: 'Your content',
          p: [
            'You keep ownership of the content you create (your selfie, status, and messages).',
            'You grant WIA a limited license to display that content within the service as needed to provide it (for example, showing your selfie to others at the venue during your visit).',
            'We may remove content or presence that violates these Terms.',
          ],
        },
        {
          h: 'Likes, matches, and chat',
          p: [
            'Likes are permanent — there is no “unlike”. A chat unlocks only when two people like each other.',
            'Use chat respectfully. Abuse may result in removal from the service.',
          ],
        },
        {
          h: 'Suspension and termination',
          p: [
            'We may suspend or terminate access for anyone who violates these Terms or puts other users at risk.',
            'You can stop using WIA at any time and request deletion of your account.',
          ],
        },
        {
          h: 'Disclaimers and liability',
          p: [
            'WIA is provided “as is”. We do not conduct background checks and are not responsible for the conduct of any user, online or in person.',
            'You are responsible for your own safety and for your interactions with other people — please read our Safety guidelines.',
            'To the fullest extent permitted by law, WIA is not liable for indirect or consequential damages arising from your use of the service.',
          ],
        },
        {
          h: 'Governing law and changes',
          p: [
            'These Terms are governed by the laws of the State of Israel.',
            'We may update these Terms from time to time; continued use after changes means you accept them.',
            `Questions? Contact us at ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
    he: {
      title: 'תנאי שימוש',
      updated: 'עודכן לאחרונה: 19 ביוני 2026',
      intro:
        'התנאים האלה חלים על השימוש שלכם ב-WIA. בסריקת קוד QR של WIA והצטרפות לחדר, אתם מסכימים להם. אם אינכם מסכימים, אנא אל תשתמשו בשירות.',
      sections: [
        {
          h: 'כשירות',
          p: [
            'יש להיות בני 18 לפחות כדי להשתמש ב-WIA.',
            'אפשר להצטרף לחדר של מקום רק כשאתם נמצאים פיזית באותו מקום.',
          ],
        },
        {
          h: 'השירות',
          p: [
            'WIA מציגה לכם את האנשים שנמצאים פיזית במקום משתתף ממש עכשיו, ומאפשרת לעשות לייק, מאצ׳ וצ׳אט איתם.',
            'הנוכחות זמנית ומקומית: היא מסתיימת כשאתם עוזבים את המקום או כשהיא פגה. WIA אינה רשת חברתית קבועה.',
          ],
        },
        {
          h: 'החשבון והזהות שלכם',
          p: [
            'האימייל או חשבון ה-Google שלכם הם הזהות שלכם ב-WIA בכל המקומות. אתם אחראים לפעילות שמתבצעת תחתיהם.',
            'שמרו על פרטי ההתחברות שלכם, והודיעו לנו אם נראה לכם שנעשה בהם שימוש לרעה.',
          ],
        },
        {
          h: 'שימוש הוגן',
          p: [
            'תהיו מכבדים. הטרדה, דברי שנאה, איומים, מעקב ויצירת קשר לא רצויה — אסורים.',
            'אסור להתחזות, ליצור פרופילים מזויפים או מטעים, או להשתמש בתמונה של מישהו אחר — הסלפי שלכם חייב להיות תמונה אמיתית וחיה שלכם.',
            'אל תפרסמו או תשלחו תוכן לא חוקי, פוגעני או מיני בוטה, ואל תצלמו או תשתפו תמונות של אנשים אחרים כדי להטריד או לחשוף אותם.',
            'אל תנסו לזייף את המיקום שלכם, לגרד מידע מהשירות, או לשבש את פעולתו.',
          ],
        },
        {
          h: 'התוכן שלכם',
          p: [
            'הבעלות על התוכן שאתם יוצרים (סלפי, סטטוס והודעות) נשארת שלכם.',
            'אתם מעניקים ל-WIA רישיון מוגבל להציג את התוכן הזה בתוך השירות ככל שנדרש כדי לספק אותו (למשל הצגת הסלפי שלכם לאחרים במקום במהלך הביקור).',
            'אנחנו עשויים להסיר תוכן או נוכחות שמפרים את התנאים האלה.',
          ],
        },
        {
          h: 'לייקים, מאצ׳ים וצ׳אט',
          p: [
            'לייקים הם קבועים — אין "ביטול לייק". צ׳אט נפתח רק כששני אנשים עושים לייק הדדי.',
            'השתמשו בצ׳אט בכבוד. שימוש לרעה עלול להוביל להסרה מהשירות.',
          ],
        },
        {
          h: 'השעיה וסיום',
          p: [
            'אנחנו עשויים להשעות או לחסום גישה למי שמפר את התנאים האלה או מסכן משתמשים אחרים.',
            'אתם יכולים להפסיק להשתמש ב-WIA בכל עת ולבקש למחוק את החשבון שלכם.',
          ],
        },
        {
          h: 'הגבלת אחריות',
          p: [
            'WIA מסופקת "כמות שהיא". איננו עורכים בדיקות רקע ואיננו אחראים להתנהגות של אף משתמש, באינטרנט או באופן אישי.',
            'אתם אחראים לבטיחות שלכם ולאינטראקציות שלכם עם אנשים אחרים — אנא קראו את הנחיות הבטיחות שלנו.',
            'במידה המרבית המותרת בחוק, WIA אינה אחראית לנזקים עקיפים או תוצאתיים הנובעים מהשימוש שלכם בשירות.',
          ],
        },
        {
          h: 'דין חל ושינויים',
          p: [
            'התנאים האלה כפופים לחוקי מדינת ישראל.',
            'אנחנו עשויים לעדכן את התנאים מעת לעת; המשך שימוש לאחר שינוי מהווה הסכמה.',
            `שאלות? כתבו לנו ל-${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
  },

  safety: {
    en: {
      title: 'Safety',
      updated: 'Last updated: June 19, 2026',
      intro:
        'Meeting new people in real life should be fun — and safe. WIA is built around being physically present, so a few common-sense habits go a long way. Please read these before you connect with someone.',
      sections: [
        {
          h: 'Meeting in person',
          p: [
            'You are already at the venue — stay in the public, populated areas when you first meet someone.',
            'Tell a friend who you are talking to and where you are. Trust your instincts; if something feels off, step away.',
            'Do not feel pressured to leave the venue with someone you just met.',
          ],
        },
        {
          h: 'Protect your information',
          p: [
            'Do not share financial information, your home address, or other sensitive details with people you have just met.',
            'Keep conversations inside WIA until you genuinely trust someone.',
          ],
        },
        {
          h: 'Report and hide',
          p: [
            'Every profile has options to hide a person from your view and to report them. Reporting also hides them from you.',
            'Please report anyone who harasses you, behaves inappropriately, or seems underage. Reports help us keep rooms safe.',
          ],
        },
        {
          h: 'Consent and respect',
          p: [
            'A like or a match is an invitation to talk — not a guarantee of anything more. Respect a “no”, and respect when someone stops responding.',
          ],
        },
        {
          h: 'Your photo and privacy',
          p: [
            'Your selfie is only visible to people at the same venue, and only during your visit — it disappears when you leave.',
            'People who are not at the venue cannot see you.',
          ],
        },
        {
          h: 'Age',
          p: ['WIA is strictly for adults 18 and over. If you believe someone is underage, please report them.'],
        },
        {
          h: 'In an emergency',
          p: [
            'If you ever feel in danger, contact local emergency services immediately. In Israel: Police 100, Ambulance 101.',
            `To report a safety concern to us, email ${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
    he: {
      title: 'בטיחות',
      updated: 'עודכן לאחרונה: 19 ביוני 2026',
      intro:
        'להכיר אנשים חדשים במציאות צריך להיות כיף — וגם בטוח. WIA בנויה סביב נוכחות פיזית, אז כמה הרגלים של שכל ישר עושים הבדל גדול. אנא קראו את אלה לפני שאתם מתחברים למישהו.',
      sections: [
        {
          h: 'מפגש פנים אל פנים',
          p: [
            'אתם כבר במקום — הישארו באזורים הציבוריים והמאוכלסים כשאתם פוגשים מישהו בפעם הראשונה.',
            'ספרו לחבר/ה עם מי אתם מדברים ואיפה אתם. סמכו על האינטואיציה שלכם; אם משהו מרגיש לא בסדר, התרחקו.',
            'אל תרגישו לחוצים לעזוב את המקום עם מישהו שהרגע הכרתם.',
          ],
        },
        {
          h: 'שמרו על המידע שלכם',
          p: [
            'אל תשתפו פרטים פיננסיים, כתובת מגורים או מידע רגיש אחר עם אנשים שהרגע הכרתם.',
            'נהלו את השיחות בתוך WIA עד שאתם באמת סומכים על מישהו.',
          ],
        },
        {
          h: 'דיווח והסתרה',
          p: [
            'לכל פרופיל יש אפשרויות להסתיר אדם מהתצוגה שלכם ולדווח עליו. דיווח גם מסתיר אותו מכם.',
            'אנא דווחו על כל מי שמטריד אתכם, מתנהג בצורה לא הולמת או נראה מתחת לגיל. דיווחים עוזרים לנו לשמור על החדרים בטוחים.',
          ],
        },
        {
          h: 'הסכמה וכבוד',
          p: [
            'לייק או מאצ׳ הם הזמנה לדבר — לא הבטחה ליותר מזה. כבדו "לא", וכבדו מצב שבו מישהו מפסיק להגיב.',
          ],
        },
        {
          h: 'התמונה והפרטיות שלכם',
          p: [
            'הסלפי שלכם גלוי רק לאנשים באותו מקום, ורק במהלך הביקור — הוא נעלם כשאתם עוזבים.',
            'מי שלא נמצא במקום לא יכול לראות אתכם.',
          ],
        },
        {
          h: 'גיל',
          p: ['WIA מיועדת אך ורק לבגירים מגיל 18 ומעלה. אם נראה לכם שמישהו מתחת לגיל, אנא דווחו עליו.'],
        },
        {
          h: 'במצב חירום',
          p: [
            'אם אי פעם אתם מרגישים בסכנה, פנו מיד לשירותי החירום המקומיים. בישראל: משטרה 100, מד״א 101.',
            `כדי לדווח לנו על בעיית בטיחות, כתבו ל-${CONTACT_EMAIL}.`,
          ],
        },
      ],
    },
  },
}
