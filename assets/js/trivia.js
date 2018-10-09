//=====================================================================================================================
//Import Modules
//=====================================================================================================================

import { firebaseAuth } from "./authorization.js";
import { config } from "./firebase.js";

const database = firebase.database();
//=====================================================================================================================
//Trivia API and all related methods
//=====================================================================================================================

export const triviaAPI = {
  queryUrl:
    "https://opentdb.com/api.php?amount=1&difficulty=easy&type=multiple&encode=base64",
  questionReturn: function() {
    game.unselector();
    $.ajax({
      url: triviaAPI.queryUrl,
      method: "GET"
    }).then(response => {
      console.log(response);
      let answers = [];
      let results = response.results[0];
      answers.push(atob(results.correct_answer));
      results.incorrect_answers.forEach(answer => {
        answers.push(atob(answer));
      });
      triviaAPI.shuffle(answers);
      //answers now stored in random order inside 'answers' array on host computer
      console.log("pushing question");
      triviaAPI.hostPushQuestion(results.question, answers)
    });
  },
  onQuestionChange: function(snapshot){
    game.currentQStatus = "Active";
    console.log(snapshot);
  },


      // game.correctAnswer = (results.correct_answer);
      // game.displayQ(atob(results.question), answers);
      // game.startTimer();
  //   });
  // },

  hostPushQuestion: function(question, answers) {
    database.ref("game/").set({
      question,
      answers
    });
    console.log("question pushed")
  },

  //Stolen shamelessly from stack overflow @ https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
  shuffle: function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
    }
    return a;
  }
  //END OF STEALING #MUSA
};

//=====================================================================================================================
//Game Methods
//=====================================================================================================================

export const game = {
  userId: "",
  sessionId: "",
  isActive: false,
  points: 0,
  questionTimer: 10,
  questionIntervalId: "",
  intervalId: "",
  userPoints: 0,
  currentQStatus: "Inactive",
  correctAnswer: "",
  selectedAnswer: "",
  selectionTimer: 0, //masking name of variable so people don't immediately change it
  displayQ: function(question, answers) {
    $("#question").html(`<h4>${question}</h4>`);
    $("#answer1").text(answers[0]);
    $("#answer2").text(answers[1]);
    $("#answer3").text(answers[2]);
    $("#answer4").text(answers[3]);
  },

  decrementPoints: function() {
    game.points -= 1;
    $("#progress-bar-value").text(`${game.points}pts`);
    $("#progress-bar-value").css("width",(1000-game.points)/10 + '%')
  },

  decrementQ: function() {
    game.questionTimer -= 1;
    if (game.questionTimer === 0) {
      game.points = 1;
      game.decrementPoints();
      game.endQuestion();
    }
  },

  startTimer: function() {
    game.questionTimer = 10;
    game.points = 1000;
    game.questionIntervalId = setInterval(game.decrementQ, 1000);
    game.intervalId = setInterval(game.decrementPoints, 10);
    $("#progress-bar-value").text('1000pts')
  },

  endQuestion: function() {
    game.currentQStatus = "Inactive";
    clearInterval(game.questionIntervalId);
    clearInterval(game.intervalId);
    console.log(`Possible Points: ${game.selectionTimer}`);
    console.log("End of question");
    //check for if answer matches the correct answer
    if (game.selectedAnswer === atob(game.correctAnswer)) {
      console.log(`Correct!`);
      game.userPoints += game.selectionTimer;
      console.log(game.userPoints);
      game.currentQStatus = "Inactive";
    } else {
      game.currentQStatus = "Inactive";
      console.log(`Correct Answer: ${atob(game.correctAnswer)}`);
    }
    if (firebaseAuth.isHost === true) {
      setTimeout(triviaAPI.questionReturn, 3000);
    }
  },

  unselector: function() {
    let collections = $(".answer");
    for(let i = 0; i < collections.length; i++) {
      $(collections[i]).parent().removeClass('active');
    }
  },

  onClick: function(event) {
    if(game.currentQStatus === "Inactive"){
      console.log("Question not active.")
    }
    else {
      game.unselector();
      game.selectedAnswer = event[0].target.innerText;
      game.selectionTimer = game.points;
      $(event[0].target).parent().addClass('active');
    }
  }
};

//=====================================================================================================================
//Game Runtime
//=====================================================================================================================

if(firebaseAuth.isHost === true){
  triviaAPI.questionReturn();
}
$(".answer").click(event => {
  game.onClick($(event));
});
