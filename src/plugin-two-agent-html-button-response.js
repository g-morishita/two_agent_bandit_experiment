import {ParameterType} from "jspsych";
import {StableBernoulliBandit} from './bandits.js'

const sleep = (milliseconds) => {
    console.log("invoke sleep");
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
    console.log("finishing sleep");
};

const info = {
    name: "plugin-two-agent-html-button-response",
    parameters: {
        choiceImages: {
            type: ParameterType.IMAGE,
            default: undefined,
        },
        rewardMean: {
            default: undefined
        },
        partnerChoice: {
            type: ParameterType.INT,
            default: undefined
        }
    },
};

/**
* plugin-two-agent-html-button-response
 *
 * The choice page for two agent bandit task
 *
 * @author Gota Morishita
 * @see not published
 */
export class PluginTwoAgentHtmlButtonResponse {
    static info = info; // static variable that contains info.
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
        this.start_time = null;
        this.response = {
            rt: null,
            choice: null,
            reward: null
        }
    };
    end_trial() {
        // data saving
        const trial_data = {
            rt: this.response.rt,
            response: this.response.choice,
            reward: this.response.reward,
            partnerResponse: this.response.partnerResponse,
            partnerReward: this.response.partnerReward
        };
        // end trial
        this.display_element.innerHTML = "";

        this.jsPsych.finishTrial(trial_data);
    };

    after_response_right() {
        const end_time = performance.now();
        const rt = Math.round(end_time - this.start_time);
        const choice = 1;
        this.response.choice = choice;
        this.response.rt = rt;

        let rightImg = document.getElementById("your-right-choice");
        rightImg.style.border = "10px solid black";
        // observe the reward
        const reward = this.bandit.getReward(choice);
        this.response.reward = reward;

        const rewardImg = document.createElement("img");
        rewardImg.src = "images/no_reward.png";
        if (reward === 1) {
            rewardImg.src = "images/reward.png";
        }
        rightImg.insertAdjacentElement('afterend', rewardImg);

        // disable all the buttons
        let leftImg = document.getElementById("your-left-choice");
        rightImg.removeEventListener("click", this.after_response_right);
        leftImg.removeEventListener("click", this.after_response_left);

        // observe the partner action and reward
        setTimeout(() => {
            const choice = this.response.partnerResponse;
            const reward = this.response.partnerReward;
            let img = null;
            if (choice === 0) {
                img = document.getElementById("partner-left-choice");
            } else {
                img = document.getElementById("partner-right-choice");
            }
            img.style.border = "10px solid black";

            const rewardImg = document.createElement("img");
            rewardImg.src = "images/no_reward.png";
            if (reward === 1) {
                rewardImg.src = "images/reward.png";
            }
            img.insertAdjacentElement('afterend', rewardImg);
        }, 1500)

        setTimeout(this.end_trial, 3000);
    };

    after_response_left() {
        const end_time = performance.now();
        const rt = Math.round(end_time - this.start_time);
        const choice = 0;
        this.response.choice = choice;
        this.response.rt = rt;

        let leftImg = document.getElementById("your-left-choice");
        leftImg.style.border = "10px solid black";

        // observe the reward
        const reward = this.bandit.getReward(choice);
        this.response.reward = reward;
        const rewardImg = document.createElement("img");
        rewardImg.src = "images/no_reward.png";
        if (reward === 1) {
            rewardImg.src = "images/reward.png";
        }
        leftImg.insertAdjacentElement('afterend', rewardImg);

        // disable all the buttons
        let rightImg = document.getElementById("your-right-choice");
        rightImg.removeEventListener("click", this.after_response_right);
        leftImg.removeEventListener("click", this.after_response_left);

        // observe the partner action and reward
        setTimeout(() => {
            const choice = this.response.partnerResponse;
            const reward = this.response.partnerReward;
            let img = null;
            if (choice === 0) {
                img = document.getElementById("partner-left-choice");
            } else {
                img = document.getElementById("partner-right-choice");
            }
            img.style.border = "10px solid black";

            const rewardImg = document.createElement("img");
            rewardImg.src = "images/no_reward.png";
            if (reward === 1) {
                rewardImg.src = "images/reward.png";
            }
            img.insertAdjacentElement('afterend', rewardImg);
        }, 1500)

        setTimeout(this.end_trial, 3000);
    };

    trial(display_element, trial) {
        // create the user interface
        this.bandit = new StableBernoulliBandit(trial.rewardMean);
        this.response.partnerResponse = trial.partnerChoice;
        this.response.partnerReward = this.bandit.getReward(this.response.partnerResponse);
        this.display_element = display_element;
        let html = `<style>
            * {
                box-sizing: border-box;
            }

            .identifier {
                font-size: 30px;
                text-align: center;
                margin-left: 20px;
                margin-right: 20px;
            }

            #header {
                display: flex;
                justify-content: center;
                height: 100%;
            }
            #you {
                display: flex;
                justify-content: center;
            }
    
            #partner {
                display: flex;
                justify-content: center;
            }
            
            #your-right-choice {
                cursor: pointer;
            }
            
            #your-left-choice {
                cursor: pointer;
            }
    
            .choice-block {
                max-width: 280px;
            }
    
            img {
                width: 95%;
                height: 30%;
                min-width: 200px;
                max-width: 300px;
            }
    
            #separation {
                border: 5px solid black;
                margin: 0 30px;
                height: 600px;
            }
            </style>
            <div id="header">
                <div id="partner">
                    <div class="choice-block"><img id="partner-left-choice" src="${trial.choiceImages[0]}"></div>
                    <p class="identifier">PARTNER</p>
                    <div class="choice-block"><img id="partner-right-choice" src="${trial.choiceImages[1]}"></div>
                </div>
                <div id="separation"></div>
                <div id="you">
                    <div class="choice-block"><img id="your-left-choice" src="${trial.choiceImages[0]}"></div>
                    <p class="identifier">YOU</p>
                    <div class="choice-block"><img id="your-right-choice" src="${trial.choiceImages[1]}"></div>
                </div>
            </div>
        `;
        display_element.innerHTML = html;

        this.start_time = performance.now();

        // add event listeners to buttons
        const rightImg = display_element.querySelector("#your-right-choice");
        rightImg.addEventListener("click",  this.after_response_right);

        const leftImg = display_element.querySelector("#your-left-choice");
        leftImg.addEventListener("click", this.after_response_left);
    };
}