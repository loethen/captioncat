// A cucumber appears behind the character, which only notices on turning around and bolts.
export const cucumber = {
  id: 'cucumber', name: 'Cucumber scare', requiredStates: ['walk', 'lick', 'watch', 'wow', 'miss'], requiredProps: ['cucumber', 'cucumberAhead'], minSpanEm: 0,
  buildSteps({ random, position, facing }) {
    // Walk to the middle first to leave room to flee; the facing afterwards decides where the cucumber sits and which way to run.
    const spot = 0.4 + random() * 0.2;
    const ahead = Math.abs(spot - position) < 0.02 ? facing : Math.sign(spot - position);
    return [
      { type: 'walk', to: spot },
      { type: 'pose', pose: 'lick', ms: 700 },                                    // busy licking a paw
      { type: 'pose', pose: 'lick', prop: 'cucumber', ms: 1200 },                // a cucumber appears behind
      { type: 'pose', pose: null, ms: 450 },                                     // done licking
      { type: 'pose', pose: 'watch', turn: true, prop: 'cucumberAhead', ms: 420 },   // turns around: a cucumber, right there
      { type: 'pose', pose: 'wow', body: 'jump', ms: 700 },                      // fur on end, jumps
      { type: 'walk', to: ahead > 0 ? 1 : 0, pose: 'wow', speed: 2.5, prop: null },   // bolts
      { type: 'pose', pose: 'miss', ms: 1100 },                                  // still shaken
      { type: 'pose', pose: null, ms: 100 },
    ];
  },
};
