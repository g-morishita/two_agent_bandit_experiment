import {ParameterType} from "jspsych";
import {StableBernoulliBandit} from './bandits.js'

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
            type: ParameterType.FUNCTION,
            default: null
        },
        order: {
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
            partnerReward: this.response.partnerReward,
            leftRewardProb: this.bandit.meanRewards[0],
            rightRewardProb: this.bandit.meanRewards[1],
            order: this.order,
        };
        // end trial
        this.display_element.innerHTML = "";

        this.jsPsych.finishTrial(trial_data);
    };

    after_response(event) {
        const chosenSide = event.currentTarget.choice;
        let notChosenSide;
        let choice;
        if (chosenSide === "right") {
            choice = 1;
            notChosenSide = "left";
        } else {
            choice = 0;
            notChosenSide = "right";
        }
        const end_time = performance.now();
        const rt = Math.round(end_time - this.start_time);
        this.response.choice = choice;
        this.response.rt = rt;

        // put a black frame to a chosen image.
        let chosenImg = document.getElementById(`your-${chosenSide}-choice`);
        chosenImg.style.border = "10px solid black";

        // observe the reward
        const reward = this.bandit.getReward(choice);
        this.response.reward = reward;

        const rewardImg = document.createElement("img");
        rewardImg.src = "images/no_reward.png";
        if (reward === 1) {
            rewardImg.src = "images/reward.png";
        }
        rewardImg.style.margin = "30px";
        chosenImg.insertAdjacentElement('afterend', rewardImg);

        // disable all the buttons
        let notChosenImg = document.getElementById(`your-${notChosenSide}-choice`);
        notChosenImg.removeEventListener("click", this.after_response);
        chosenImg.removeEventListener("click", this.after_response);

        // observe the partner action and reward
        if (this.response.partnerResponse !== null) {
            const waitingTime = this.jsPsych.randomization.sampleWithoutReplacement([500, 500, 500, 1000, 1000, 1000, 1000, 1500], 1)[0]
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
                rewardImg.style.margin = "30px";
                img.insertAdjacentElement('afterend', rewardImg);
            }, waitingTime + 2000);
            setTimeout(this.end_trial, waitingTime + 3500);
        } else {
            setTimeout(this.end_trial,  1500);
        }
    };

    trial(display_element, trial) {
        // create the user interface
        this.bandit = new StableBernoulliBandit(trial.rewardMean);
        this.response.partnerReward = null;
        this.order = trial.order;
        if (trial.partnerChoice === null) {
            this.response.partnerResponse = null;
        } else {
            this.response.partnerResponse = trial.partnerChoice();
            this.response.partnerReward = this.bandit.getReward(this.response.partnerResponse);
        }
        this.display_element = display_element;
        let html = `<style>
            * {
                box-sizing: border-box;
            }

            .identifier {
                font-size: 30px;
                text-align: center;
                margin-left: 10px;
                margin-right: 10px;
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
            
            .choice-img {
                margin: 30px; 
            }
    
            .choice-block {
                max-width: 260px;
            }
    
            img {
                width: 40%;
                height: 40%;
                min-width: 200px;
                max-width: 300px;
            }
    
            #separation {
                border: 5px solid black;
                margin: 0;
                height: 600px;
            }
            </style>
        <div id="header">`;
        // Choose images
        let yourLeftImg, partnerLeftImg;
        let yourRightImg, partnerRightImg;
        let partnerColor = "black";
        yourLeftImg = partnerLeftImg = trial.choiceImages[0];
        yourRightImg = partnerRightImg = trial.choiceImages[1];
        if (this.response.partnerResponse === null) {
            partnerLeftImg = partnerRightImg = "images/transparent.png";
            partnerColor = "white";
        }
        if (trial.order === 0) {
            html += `                
                <div id="partner">
                    <div class="choice-block"><img class="choice-img" id="partner-left-choice" src="${partnerLeftImg}"></div>
                    <p class="identifier" style="color: ${partnerColor};">PARTNER</p>
                    <div class="choice-block"><img class="choice-img" id="partner-right-choice" src="${partnerRightImg}"></div>
                </div>
                <div id="separation"></div>
                <div id="you">
                    <div class="choice-block"><img class="choice-img" id="your-left-choice" src="${yourLeftImg}"></div>
                    <p class="identifier">YOU</p>
                    <div class="choice-block"><img class="choice-img" id="your-right-choice" src="${yourRightImg}"></div>
                </div>`;
        } else {
            html += `
                <div id="you">
                    <div class="choice-block"><img class="choice-img" id="your-left-choice" src="${yourLeftImg}"></div>
                    <p class="identifier">YOU</p>
                    <div class="choice-block"><img class="choice-img" id="your-right-choice" src="${yourRightImg}"></div>
                </div>
                <div id="separation"></div>
                <div id="partner">
                    <div class="choice-block"><img class="choice-img" id="partner-left-choice" src="${partnerLeftImg}"></div>
                    <p class="identifier" style="color: ${partnerColor};">PARTNER</p>
                    <div class="choice-block"><img class="choice-img" id="partner-right-choice" src="${partnerRightImg}"></div>
                </div>`;
        }
        html += `</div>`;
        display_element.innerHTML = html;

        this.start_time = performance.now();

        // add event listeners to buttons
        const rightImg = display_element.querySelector("#your-right-choice");
        rightImg.addEventListener("click",  this.after_response);
        rightImg.choice = "right";

        const leftImg = display_element.querySelector("#your-left-choice");
        leftImg.addEventListener("click", this.after_response);
        leftImg.choice = "left";
    };
}