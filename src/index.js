import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import {QLearner} from './agents.js'
import {StableBernoulliBandit} from './bandits.js'
import {config} from './config.js'

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData() // for debugging
});
const timeline = [];
const agent = new QLearner(
  config.agentAlpha,
  config.agentBeta,
  config.rewardDist.length
);
let rewardDist = config.rewardDist;
const randomInt = Math.floor(Math.random());
rewardDist[1], rewardDist[0] = rewardDist[randomInt], rewardDist[1 - randomInt];
const bandit = new StableBernoulliBandit(rewardDist);


const welcome = {
  type: htmlKeyboardResponse,
  stimulus: `<h1>Welcome to the experiment. Press any key to begin.</h1>`
};

timeline.push(welcome);

// TODO: Need to modify the experiment
const instructions = {
  type: htmlKeyboardResponse,
  stimulus: `
    <p>In this experiment, a circle will appear in the center 
    of the screen.</p><p>If the circle is <strong>blue</strong>, 
    press the letter F on the keyboard as fast as you can.</p>
    <p>If the circle is <strong>orange</strong>, press the letter J 
    as fast as you can.</p>
    <div style='width: 700px;'>
    <div style='float: left;'><img src='img/blue.png'></img>
    <p class='small'><strong>Press the F key</strong></p></div>
    <div style='float: right;'><img src='img/orange.png'></img>
    <p class='small'><strong>Press the J key</strong></p></div>
    </div>
    <p>Press any key to begin.</p>
  `,
  on_finish: (data) => {
    data.rewardDist = rewardDist;
    data.config = config;
  }
};

timeline.push(instructions);

const trial = {
  type: htmlButtonResponse,
  stimulus: "",
  choices: ["arm1", "arm2"],
  on_finish: (data) => {
    const chosenArm = parseInt(data.response);
    data.arm = chosenArm;
    data.reward = bandit.getReward(chosenArm);

    // Agent's trial
    const agentChosenArm = agent.takeAction();
    const agentReward = bandit.getReward(chosenArm);
    data.agentArm = agentChosenArm;
    data.agentReward = agentReward;

    // Agent's update based on your own experiment
    agent.updateQValues(agentChosenArm, agentReward);
  }
}

const ownResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(1).values()[0];
    const arm = data["arm"];
    const reward = data["reward"];
    return `You chose Arm ${arm}. You got a reward of ${reward}`;
  }
};

const agentResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(2).values()[0];
    const arm = data["agentArm"];
    const reward = data["agentReward"];
    return `The other chose Arm ${arm}. The other got a reward of ${reward}`;
  }
}

const test_procedure = {
  timeline: [trial, ownResult, agentResult],
  repetitions: config["timeHorizon"]
};

timeline.push(test_procedure);

jsPsych.run(timeline);
