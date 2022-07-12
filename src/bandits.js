export class StableBernoulliBandit {
  constructor(meanRewards) {
    this.meanRewards = meanRewards;
  }
  get meanRewards() {
    return this._meanRewards;
  }
  set meanRewards(meanRewards) {
    if (typeof this.meanRewards !== "undefined") {
      throw "You can't change the mean reward.";
    }
    // Check the length of the reward probabilities is larger than 1.
    if (meanRewards.length <= 1) {
      throw `The length of the meanRewards is less than 2. Check the given param: ${meanRewards}`;
    }
    // Check the reward probability is in a valid range [0, 1].
    for (const meanReward of meanRewards) {
      if ((meanReward < 0) && (meanReward > 1)) {
        throw `Mean must be somewhere between 0 and 1. Given ${meanReward}`;
      }
    }
    this._meanRewards = meanRewards;
  }

  getReward(chosenArm) {
    const randomVal = Math.random();
    if (chosenArm >= this._meanRewards.length) {
      throw `The index of arm exceeds the given reward vector. Given ${chosenArm}`;
    }
    const meanReward = this._meanRewards[chosenArm]
    if (meanReward > randomVal) {
      return 1;
    }
    return 0;
  }
}
