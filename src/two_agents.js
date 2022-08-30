import {initJsPsych} from 'jspsych';
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychPreload from '@jspsych/plugin-preload';
import jsPsychInstructions from '@jspsych/plugin-instructions';
import jsPsychCallFunction from '@jspsych/plugin-call-function';
import {QLearner} from "./agents";
import {config, unknown_config} from './config.js'
import "./style.css"
import {putS3, download, choiceImageCandidates} from "./helper";
import {askName} from "./components";
import {PluginTwoAgentHtmlButtonResponse} from "./plugin-two-agent-html-button-response";
import {StableBernoulliBandit} from "./bandits";
import htmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";

// Functions to create tasks
// Single-Agent Bandit
const createSingleAgentSession = (numTrials) => {
    const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);
    const trial = {
        type: PluginTwoAgentHtmlButtonResponse,
        choiceImages: images,
        rewardMean: unknownChoiceRewardProbs[currentSession],
        partnerChoice: null,
        order: jsPsych.randomization.sampleWithoutReplacement([0, 1], 1)[0],
        on_finish: (data) => {
            // update the agent Q values
            agent.updateQValues(data.partnerResponse, data.partnerReward);
        }
    };

    const session = {
        timeline: [trial],
        repetitions: numTrials // config.timeHorizon
    };
    timeline.push(session);
};

// TWo-Agent Bandit
const createTwoAgentSession = (numTrials) => {
    const agent = new QLearner(config.agentAlpha, config.agentBeta, numArm); // later randomize alpha and beta.
    const start_session = {
        type: htmlKeyboardResponse,
        stimulus: () => {
            let html = `<h1>Two Agent Practice Session</h1>`;
            return html;
        },
        trial_duration: 2000, //ms
        response_ends_trial: false
    };
    timeline.push(start_session);

    const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);
    const trial = {
        type: PluginTwoAgentHtmlButtonResponse,
        choiceImages: images,
        rewardMean: unknownChoiceRewardProbs[currentSession],
        partnerChoice: function() {return agent.takeAction()},
        order: jsPsych.randomization.sampleWithoutReplacement([0, 1], 1)[0],
        on_finish: (data) => {
            // update the agent Q values
            agent.updateQValues(data.partnerResponse, data.partnerReward);
        }
    };

    const session = {
        timeline: [trial],
        repetitions: numTrials // config.timeHorizon
    };
    timeline.push(session);
};

// Starting Page
const createStartingSession = (message) => {
    const session =  {
        type: htmlKeyboardResponse,
        stimulus: () => {
            let html = `<h1>${message}</h1>`;
            return html;
        },
        trial_duration: 2000, //ms
        response_ends_trial: false
    };
    timeline.push(session);
};

// Setting
const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});
const numArm = 2;
const timeline = [];

// Experimental setting
const choiceImages = jsPsych.randomization.sampleWithoutReplacement(choiceImageCandidates, 16);
let unknownChoiceRewardProbs = [];
for (let i = 0; i < 8; i++) {
    if (i <= 1) {
        unknownChoiceRewardProbs.push([0.8, 0.3]);
    } else {
        const unknownProbs = jsPsych.randomization.sampleWithoutReplacement(config.unknownRewardCandidates, 2);
        unknownChoiceRewardProbs.push(unknownProbs);
    }
}

// Preload the images.
const choiceImagesPath = [...Array(16).keys()].map(x => 'images/choice' + (x+1) + '.png');
const preload = {
    type: jsPsychPreload,
    auto_preload: true,
    images: choiceImagesPath.concat(["images/reward.png", "images/no_reward.png"])
};
// timeline.push(preload); TODO: Need to fix

// Instruction
const instruction = {
    type: jsPsychInstructions,
    pages: [`<h1>Bandit Exp</h1>
            <li>
                <ul>single-agent practice</ul>
                <ul>Two-agent practice</ul>
                <ul>Single agent practice1</ul>
                <ul>single agent practice2</ul>
                <ul>two agent practice1</ul>
                <ul>two agent practice2</ul>
                <ul>two agent practice3</ul>
                <ul>two agent practice4</ul>
            </li>
    `],
    show_clickable_nav: true
}
timeline.push(instruction);

///////////////////////// Single Agent Practice Session ////////////////////////////
let currentSession = 0;
createStartingSession("Single Agent Practice Session Starts in two seconds");
createSingleAgentSession(30);

///////////////////////// Two Agent Practice Session ////////////////////////////
currentSession += 1;
createStartingSession("Two Agent Practice Session Starts in two seconds");
createTwoAgentSession(30);

///////////////////////// Single Agent Actual Session ////////////////////////////
for (let i = 0; i < 2; i++) {
    currentSession += 1;
    createStartingSession(`Single Agent Session ${currentSession - 1} Starts in two seconds`);
    createSingleAgentSession(70);
}

///////////////////////// Two Agent Session////////////////////////////

for (let i = 0; i < 2; i++) {
    currentSession += 1;
    createStartingSession(`Two Agent Session ${currentSession - 3} Starts in two seconds`);
    createTwoAgentSession(70);
}

for (let i = 0; i < 1; i++) {
    currentSession += 1;
    createSingleAgentSession();
}

// The end
const end = {
    type: jsPsychInstructions,
    pages: [`<h1>This is the end</h1>`]
}
timeline.push(end);
jsPsych.run(timeline);