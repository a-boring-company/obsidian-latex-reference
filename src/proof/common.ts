import { Profile, } from 'settings/profile';

export function makeProofClasses(which: 'begin' | 'end', profile: Profile,) {
  // Generate both old (math-booster-*) and new (latex-referencer-*) class names for backward compatibility
  return [
    'math-booster-' + which + '-proof', // deprecated - maintained for custom CSS compatibility
    'latex-referencer-' + which + '-proof',
    ...profile.meta.tags.map((tag,) => 'math-booster-' + which + '-proof-' + tag), // deprecated - maintained for custom CSS compatibility
    ...profile.meta.tags.map((tag,) => 'latex-referencer-' + which + '-proof-' + tag),
  ];
}

export function makeProofElement(which: 'begin' | 'end', profile: Profile,) {
  return createSpan({
    text: profile.body.proof[which],
    cls: makeProofClasses(which, profile,),
  },);
}
