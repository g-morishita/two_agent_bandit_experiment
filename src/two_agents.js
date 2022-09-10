import {initJsPsych} from 'jspsych';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-image-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import fullscreen from '@jspsych/plugin-fullscreen';
import jsPsychPreload from '@jspsych/plugin-preload';
import jsPsychInstructions from '@jspsych/plugin-instructions';
import {QLearner} from "./agents";
import {config} from './config.js'
import "./style.css"
import {putS3, choiceImageCandidates} from "./helper";
import {PluginTwoAgentHtmlButtonResponse} from "./plugin-two-agent-html-button-response";
import htmlKeyboardResponse from "@jspsych/plugin-html-keyboard-response";
import jsPsychCallFunction from "@jspsych/plugin-call-function";
import JSZip from 'jszip'
import { saveAs } from 'file-saver';

// data processing
const preprocess = (jsonData) => {
    let csvResult = "participant,session,rt,choice,reward,partnerChoice,partnerReward,alpha,beta,leftRewardProb,rightRewardProb\r\n"
    for (let trial of jsonData["trials"]) {
        if (trial.hasOwnProperty("session")) {
            csvResult += Date.now() + ',';
            csvResult += trial["session"] + ',';
            csvResult += trial["rt"] + ',';
            csvResult += trial["response"] + ',';
            csvResult += trial["reward"] + ',';
            csvResult += trial["partnerResponse"] + ',';
            csvResult += trial["partnerReward"] + ',';
            csvResult += trial["alpha"] + ',';
            csvResult += trial["beta"] + ',';
            csvResult += trial["leftRewardProb"] + ',';
            csvResult += trial["rightRewardProb"];
            csvResult += '\r\n';
        }
    }
    return csvResult;
};

const postProcess = () => {
    const jsonFileName = Date.now() + '.json';
    const csvFileName = Date.now() + '.csv';
    const zip = new JSZip();
    const result = jsPsych.data.get();
    const csvResult = preprocess(result)
    zip.file(jsonFileName, JSON.stringify(result));
    zip.file(csvFileName, csvResult);
    zip.generateAsync({type:"blob"})
        .then(function(content) {
            saveAs(content, "example.zip");
        });
    putS3(JSON.stringify(result), jsonFileName);
    putS3(csvResult, csvFileName);
};

// Functions to create tasks
// Single-Agent Bandit
const createSingleAgentSession = (numTrials, currentSession) => {
    const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);
    const trial = {
        type: PluginTwoAgentHtmlButtonResponse,
        choiceImages: images,
        rewardMean: unknownChoiceRewardProbs[currentSession],
        partnerChoice: null,
        order: jsPsych.randomization.sampleWithoutReplacement([0, 1], 1)[0],
        on_finish: (data) => {
            data.session = currentSession;
            data.alpha = null;
            data.beta = null;
        }
    };

    const session = {
        timeline: [trial],
        repetitions: numTrials
    };
    timeline.push(session);
};

// Two-Agent Bandit
const createTwoAgentSession = (numTrials, currentSession, alpha, beta) => {
    const agent = new QLearner(alpha, beta, numArm); // later randomize alpha and beta.

    const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);
    const trial = {
        type: PluginTwoAgentHtmlButtonResponse,
        choiceImages: images,
        rewardMean: unknownChoiceRewardProbs[currentSession],
        partnerChoice: function() {return agent.takeAction()},
        order: jsPsych.randomization.sampleWithoutReplacement([0, 1], 1)[0],
        on_finish: (data) => {
            data.session = currentSession;
            data.alpha;
            data.beta = beta;
            // update the agent Q values
            agent.updateQValues(data.partnerResponse, data.partnerReward);
            console.log("agent: qValues");
            console.log(agent.qValues);
            console.log("agent: beta");
            console.log(agent.beta);
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
        trial_duration: 5000, //ms
        response_ends_trial: false
    };
    timeline.push(session);
};

const createStartingSessionForTwoAgent = (message) => {
    const session =  {
        type: htmlKeyboardResponse,
        stimulus: () => {
            let html = `<h1>${message}</h1>`;
            return html;
        },
        trial_duration: jsPsych.randomization.sampleWithoutReplacement([5000, 7000, 10000], 1)[0], //ms
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

const alpha = config.agentAlpha;
let candidateBetas = []
for (let i = 0; i < 2; i++) {
    candidateBetas.push(config.agentLowBeta);
    candidateBetas.push(config.agentHighBeta);
}
const betas = jsPsych.randomization.sampleWithoutReplacement(candidateBetas, 4);

// Preload the images.
const choiceImagesPath = [...Array(16).keys()].map(x => 'images/choice' + (x+1) + '.png');
const preload = {
    type: jsPsychPreload,
    auto_preload: true,
    images: choiceImagesPath.concat(["images/reward.png", "images/no_reward.png"])
};
timeline.push(preload);

timeline.push({
    type: fullscreen,
    fullscreen_mode: true
});

///////////////////////// Single Agent Practice Session ////////////////////////////
let currentSession = 0;
const singlePracticeInstructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="font-size: 30px; text-align: center; margin-top: 50px;">
    <p>In this <b>practice</b> single-agent session, there are two fractal images.</p>
    <p>Each of the images is associated with a reward probability.</p>
    <p>You can make a choice by clicking one of the images.</p>
    <p>Immediately after clicking the image, you will observe whether you get a reward or not.</p>
    <p>The goal of this task is to identify the more rewarding choice so that you will obtain as many rewards as possible</p>
    <p>This is a <b>practice session</b>, so it does not affect the payment.</p>
    <p>Press Proceed button to proceed.</p></div>`,
    choices: ['Proceed'],
};
timeline.push(singlePracticeInstructions);

createStartingSession("<b>Single Agent Practice</b> Session Starts in five seconds");
createSingleAgentSession(config.practiceTimeHorizon, currentSession);

///////////////////////// Two Agent Practice Session ////////////////////////////
currentSession += 1;

const twoPracticeInstructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="font-size: 30px; text-align: center; margin-top: 50px;">
        <p>In this <b>practice</b> two-agent session, there are two pairs of two fractal images.</p>
        <p>One of the sides is labeled "You" while the other is labeled "Partner."</p>
        <p>Each of the images is associated with a reward probability as in the previous session.</p>
        <p>You can make a choice by clicking one of the images in the side labeled "You"</p>
        <p>Immediately after clicking the image, you will observe whether you get a reward or not.</p>
        <p>You will also observe your partner's choice and its outcome a few seconds after the partner make a choice.</p>
        <p>Even if the partner makes a choice before your choice, you will observe the partner's choice and outcome 1 second after you choice.</p>
        <p>This is a <b>practice session</b>, so this session does not affect the payment.</p>
        <p>Press Proceed button to proceed.</p></div>`,
    choices: ['Proceed']
};
timeline.push(twoPracticeInstructions);

createStartingSession("<b>Two Agent Practice</b> Session Starts in five seconds");
createTwoAgentSession(config.practiceTimeHorizon, currentSession);

///////////////////////// Single Agent Actual Session ////////////////////////////
const actualSingleSessionInstructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="font-size: 30px; text-align: center; margin-top: 50px;">
        <p>The practice sessions have finished. Next, the actual sessions will start.</p>
        <p>The first two sessions are a <b>single-agent bandit task</b> where there are just two images and no partner.</p>
        <p>If you have any question, let the experimenter know before you start the actual sessions.</p>
        <p>Press Proceed Button to begin when you are ready</p></div>`,
    choices: ['Proceed']
};
timeline.push(actualSingleSessionInstructions);

for (let i = 0; i < 2; i++) {
    currentSession += 1;
    createStartingSession(`Single Agent Session ${currentSession - 1} Starts in five seconds`);
    createSingleAgentSession(config.timeHorizon, currentSession);
}

///////////////////////// Two Agent Session////////////////////////////
const actualTwoSessionInstructions = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `<div style="font-size: 30px; text-align: center; margin-top: 50px;">
        <p>The single-agent sessions have finished. Next, the two-agent sessions will start.</p>
        <p>You might wait for a few minutes until a matched partner finishes the previous session.</p>
        <p>Press Proceed Button to begin when you are ready.</p></div>`,
    choices: ['Proceed']
};
timeline.push(actualTwoSessionInstructions);

for (let i = 0; i < 4; i++) {
    currentSession += 1;
    createStartingSessionForTwoAgent(`Two Agent Session ${currentSession - 3} Starts when a matched partner is ready. Note that a partner is randomly matched every session.`);
    createTwoAgentSession(config.timeHorizon, currentSession, alpha, betas[i]);
}

// The end
const postProcessTrial = {
    type: jsPsychCallFunction,
    func: postProcess
};
timeline.push(postProcessTrial);

const end = {
    type: jsPsychInstructions,
    pages: [`<div style="font-size: 30px; text-align: center; margin-top: 50px;">
        <p>The experiment has finished. Thank you for participating in our experiment.</p>
        <p>Please go outside and let the experimenter know that you finished all the sessions. </p>
        </div>`]
}
timeline.push(end);
jsPsych.run(timeline);

// Prevent F5 and refreshing
const beforeUnloadListener = (event) => {
    return event.returnValue = "Are you sure you want to exit?";
};
addEventListener("beforeunload", beforeUnloadListener, {capture: true});