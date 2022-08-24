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

// Setting
const jsPsych = initJsPsych();
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

let currentSession = 0;
///////////////////////// Single Agent Practice Session ////////////////////////////
let bandit = new StableBernoulliBandit(unknownChoiceRewardProbs[currentSession]);
let images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1));
const practice_trial = {
    type: htmlButtonResponse,
        stimulus: '',
    choices: images,
    button_html: `<img style="cursor: pointer;" src='images/%choice%' />`,
    on_finish: (data) => {
        data.session = currentSession;
        data.meanRewardChoice1 = bandit.meanRewards[0];
        data.meanRewardChoice2 = bandit.meanRewards[1];
        data.reward = bandit.getReward(data.response);
    }
};

const practice_result = {
    type: htmlKeyboardResponse,
    stimulus: () => {
        const data =  jsPsych.data.get().last(1).values()[0];
        const reward = data["reward"];
        let html = '';
        if (reward === 1) {
            html += `<img style="width: 400px;" src="images/reward.png"></img>`
        } else {
            html += `<img style="width: 400px;" src="images/no_reward.png"></img>`
        }
        return html;
    },
    trial_duration: 2000, // ms
    response_ends_trial: false // Prevent participants from skipping the page.
}

const practice_session = {
    timeline: [practice_trial, practice_result],
    repetitions: 1 // config.practiceTimeHorizon
};
timeline.push(practice_session);

currentSession += 1;
///////////////////////// Two Agent Practice Session ////////////////////////////
let start_session = {
    type: htmlKeyboardResponse,
    stimulus: () => {
        let html = `<h1>Two Agent Practice Session</h1>`;
        return html;
    },
    trial_duration: 2000, //ms
    response_ends_trial: false
};

timeline.push(start_session);
const agent = new QLearner(config.agentAlpha, config.agentBeta, numArm);
images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);

const practice_two_agent_trial = {
    type: PluginTwoAgentHtmlButtonResponse,
    choiceImages: images,
    rewardMean: unknownChoiceRewardProbs[currentSession],
    partnerChoice: agent.takeAction(), // TODO: this is fixed value so need to make it variabel.
    on_finish: (data) => {
        // update the agent Q values
        agent.updateQValues(data.partnerResponse, data.partnerReward);
    }
};

const practice_two_agent_session = {
    timeline: [practice_two_agent_trial],
    repetitions: 2 // config.practiceTimeHorizon
};

timeline.push(practice_two_agent_session);

///////////////////////// Single Agent Session 1////////////////////////////
const createSingleAgentSession = () => {
    const start_session = {
        type: htmlKeyboardResponse,
        stimulus: () => {
            let html = `<h1>Single Agent Session ${currentSession}</h1>`;
            return html;
        },
        trial_duration: 2000, //ms
        response_ends_trial: false
    };
    timeline.push(start_session);
    const bandit = new StableBernoulliBandit(unknownChoiceRewardProbs[currentSession]);
    const images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1));
    const singleAgentTrial = {
        type: htmlButtonResponse,
        stimulus: '',
        choices: images,
        button_html: `<img style="cursor: pointer;" src='images/%choice%' />`,
        on_finish: (data) => {
            data.session = currentSession;
            data.meanRewardChoice1 = bandit.meanRewards[0];
            data.meanRewardChoice2 = bandit.meanRewards[1];
            data.reward = bandit.getReward(data.response);
        }
    };
    const singleAgentResult = {
        type: htmlKeyboardResponse,
        stimulus: () => {
            const data =  jsPsych.data.get().last(1).values()[0];
            const reward = data["reward"];
            let html = '';
            if (reward === 1) {
                html += `<img style="width: 400px;" src="images/reward.png"></img>`
            } else {
                html += `<img style="width: 400px;" src="images/no_reward.png"></img>`
            }
            return html;
        },
        trial_duration: 2000, // ms
        response_ends_trial: false // Prevent participants from skipping the page.
    };

    const singleAgentSession = {
        timeline: [singleAgentTrial, singleAgentResult],
        repetitions: 3 // config.practiceTimeHorizon
    };
    timeline.push(singleAgentSession);
};
currentSession += 1;
createSingleAgentSession();

///////////////////////// Single Agent Session 2////////////////////////////
currentSession += 1;
createSingleAgentSession();

///////////////////////// Two Agent Session 1////////////////////////////
currentSession += 1;
const createTwoAgentSession = () => {
    const agent = new QLearner(config.agentAlpha, config.agentBeta, numArm); // later randomize alpha and beta.
    const start_session = {
        type: htmlKeyboardResponse,
        stimulus: () => {
            let html = `<h1>Two Agent Practice Session ${currentSession - 2}</h1>`;
            return html;
        },
        trial_duration: 2000, //ms
        response_ends_trial: false
    };
    timeline.push(start_session);

    images = choiceImages.slice(2 * currentSession, 2 * (currentSession + 1)).map(x => 'images/' + x);
    const trial = {
        type: PluginTwoAgentHtmlButtonResponse,
        choiceImages: images,
        rewardMean: unknownChoiceRewardProbs[currentSession],
        partnerChoice: agent.takeAction(), // TODO: this is fixed value so need to make it variabel.
        on_finish: (data) => {
            // update the agent Q values
            agent.updateQValues(data.partnerResponse, data.partnerReward);
        }
    };

    const session = {
        timeline: [practice_two_agent_trial],
        repetitions: 3 // config.timeHorizon
    };
    timeline.push(session);
};
createTwoAgentSession();

///////////////////////// Two Agent Session 2////////////////////////////
currentSession += 1;
createTwoAgentSession();

// The end
const end = {
    type: jsPsychInstructions,
    pages: [`<h1>This is the end</h1>`]
}
timeline.push(end);

jsPsych.run(timeline);