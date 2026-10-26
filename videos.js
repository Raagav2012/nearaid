// =====================================================================
// PUT YOUR VIDEO LINKS HERE
// Replace each PASTE_LINK_HERE with a full link, like:
//   https://www.youtube.com/watch?v=XXXXXXXXXXX
// You can also change any title or description.
// Do NOT change the "id" values (the database uses them).
// =====================================================================

// 1) The two videos every responder must watch before adding a CPR card
export const REQUIRED_VIDEOS = [
  {
    id: 'required-1',
    title: 'Required video 1: CPR basics',
    description: 'Please watch this video completly',
    url: 'https://www.youtube.com/watch?v=BUhUiPeEX-8',
  },
  {
    id: 'required-2',
    title: 'Required video 2: Being a Pulse responder',
    description: 'How to respond safely and what to expect.',
    url: 'https://www.youtube.com/watch?v=BUhUiPeEX-8',
  },
];

// 2) The four videos anyone can watch
export const OPTIONAL_VIDEOS = [
  {
    id: 'optional-1',
    title: 'How to help someone who is choking',
    description: 'How to perform the Heimlich Maneuver',
    url: 'https://www.youtube.com/watch?v=SqpcTF2HFvg',
  },
  {
    id: 'optional-2',
    title: 'How to stop serious bleeding',
    description: 'Pressure, bandages and tourniquets.',
    url: 'https://www.youtube.com/watch?v=qhOyXTm9XwY',
  },
  {
    id: 'optional-3',
    title: 'How to use an AED',
    description: 'Using a defibrillator step by step. Please do not start CPR if you do not know how to.',
    url: 'https://www.youtube.com/watch?v=in8j2Q2z3HE',
  },
  {
    id: 'optional-4',
    title: 'How to tie a tourniquet',
    description: 'Useful to stop bleeding',
    url: 'https://www.youtube.com/watch?v=F83HXDoGvuU',
  },
];

export const REQUIRED_IDS = REQUIRED_VIDEOS.map((v) => v.id);
export const hasLink = (v) => /^https?:\/\//i.test((v.url || '').trim());
