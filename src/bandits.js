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
