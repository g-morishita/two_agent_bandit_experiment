import {initJsPsych} from 'jspsych';
import htmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response'; import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychPreload from '@jspsych/plugin-preload';
import {QLearner} from './agents.js'
import {StableBernoulliBandit} from './bandits.js'
import {config} from './config.js'

const jsPsych = initJsPsych({
  on_finish: () => jsPsych.data.displayData() // for debugging
});
const timeline = [];

// Instantiate an agent class.
const agent = new QLearner(
  config.agentAlpha,
  config.agentBeta,
  config.rewardDist.length
);

// Shuffule the reward distribution.
let rewardDist = config.rewardDist;
const randomInt = Math.floor(Math.random() * 2);
[rewardDist[1], rewardDist[0]] = [rewardDist[randomInt], rewardDist[1 - randomInt]];

const bandit = new StableBernoulliBandit(rewardDist);

// Preload the images.
const preload = {
  type: jsPsychPreload,
  auto_preload: true,
  images: ["img/blue_slot_machine.png", "img/red_slot_machine.png", "img/coin_medal_silver.png"]
}
timeline.push(preload)

const welcome = {
  type: htmlKeyboardResponse,
  stimulus: `<h1>Welcome to the experiment. Press any key to begin.</h1>`
};
timeline.push(welcome);

const instructions = {
  type: htmlKeyboardResponse,
  stimulus: `
    <p>in this experiment, there are two slot machines with different colors, red and blue.
    In each trial, you are going to choose one of them by clicking the image of the slot and know if you win or not later.</p>
    <p>Each of these two slots have a different probability of winning. Hence, you should "explore" and know which slot is btter.</p>
    <p>Note that the probabilies are fixed through the same session.</p>
    <p>Also, there is another person who play the same slot machines. You can observe his/her result after each trial while the other also observe your own result.</p>
    <div style='width: 800px;'>
    <div style='float: left;'><img src='img/blue_slot_machine.png'></img>
    <div style='float: right;'><img src='img/red_slot_machine.png'></img>
    </div>
    <p>press any key to begin.</p>
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
  choices: ["red_slot_machine.png", "blue_slot_machine.png"],
  button_html: `<img src='img/%choice%'></img>`,
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
    const armColor = data["arm"] == 0 ? "red" : "blue";
    const reward = data["reward"];
    let html = `<p>You chose <font color="${armColor}">${armColor}</font>.</p>`
    if (reward == 1) {
      html += `<div style="width: 600px"><img src="img/coin_medal_silver.png"></img></div>`
    } else {
      html += "You failed..." // TODO: Add some image for a failure.
    }
    return html;
  }
};

const agentResult = {
  type: htmlKeyboardResponse,
  stimulus: () => {
    const data =  jsPsych.data.get().last(2).values()[0];
    const armColor = data["agentArm"] == 0 ? "red" : "blue";
    const reward = data["agentReward"];
    let html = `<p>The other chose <font color="${armColor}">${armColor}</font>.</p>`
    if (reward == 1) {
      html += `<div style="width: 600px"><img src="img/coin_medal_silver.png"></img></div>`
    } else {
      html += "The other failed..." // TODO: Add some image for a failure.
    }
    return html;
  }
}

const test_procedure = {
  timeline: [trial, ownResult, agentResult],
  repetitions: config["timeHorizon"]
};

timeline.push(test_procedure);

jsPsych.run(timeline);
