$(document).ready(function () {
  var currentQuestion = 0;
  var totalQuestions = 0;
  var userAnswers = {};
  var all_questions;
  var all_questions_en;
  var all_evidences;
  var all_evidences_en;
  var faq;
  var faq_en;
  var currentLanguage = "greek";

  function hideFormBtns() {
    $("#nextQuestion").hide();
    $("#backButton").hide();
  }

  function getQuestions() {
    return fetch("question-utils/all-questions.json")
      .then((res) => res.json())
      .then((data) => {
        all_questions = data;
        totalQuestions = data.length;
        return fetch("question-utils/all-questions-en.json");
      })
      .then((res) => res.json())
      .then((dataEn) => {
        all_questions_en = dataEn;
      })
      .catch((err) => {
        console.error(err);
        $(".question-container").html("Failed to fetch questions.");
        hideFormBtns();
      });
  }

  function getEvidences() {
    return fetch("question-utils/cpsv.json")
      .then((res) => res.json())
      .then((data) => {
        all_evidences = data;
        return fetch("question-utils/cpsv-en.json");
      })
      .then((res) => res.json())
      .then((dataEn) => {
        all_evidences_en = dataEn;
      })
      .catch((err) => {
        console.error(err);
        $(".question-container").html("Failed to fetch evidences.");
        hideFormBtns();
      });
  }

  function getFaq() {
    return fetch("question-utils/faq.json")
      .then((res) => res.json())
      .then((data) => {
        faq = data;
        return fetch("question-utils/faq-en.json");
      })
      .then((res) => res.json())
      .then((dataEn) => {
        faq_en = dataEn;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  function getEvidencesById(id) {
    var selectedEvidence = currentLanguage === "greek" ? all_evidences : all_evidences_en;
    selectedEvidence = selectedEvidence.PublicService.evidence.find((e) => e.id === id);
    if (selectedEvidence) {
      const el = document.getElementById("evidences");
      selectedEvidence.evs.forEach((ev) => {
        const li = document.createElement("li");
        li.textContent = ev.name;
        el.appendChild(li);
      });
    }
  }

  function loadQuestion(qId, noError) {
    $("#nextQuestion").show();
    if (currentQuestion > 0) $("#backButton").show();
    var question = currentLanguage === "greek" ? all_questions[qId] : all_questions_en[qId];
    var qElem = document.createElement("div");
    if (noError) {
      qElem.innerHTML = `<div class='govgr-field'><fieldset class='govgr-fieldset'><legend class='govgr-fieldset__legend govgr-heading-l'>${question.question}</legend><div class='govgr-radios' id='radios-${qId}'>${question.options.map(opt => `<div class='govgr-radios__item'><label class='govgr-label govgr-radios__label'>${opt}<input class='govgr-radios__input' type='radio' name='question-option' value='${opt}' /></label></div>`).join('')}</div></fieldset></div>`;
    } else {
      qElem.innerHTML = `<div class='govgr-field govgr-field__error'><legend class='govgr-fieldset__legend govgr-heading-l'>${question.question}</legend><p class='govgr-error-message'>Πρέπει να επιλέξετε μια απάντηση</p><div class='govgr-radios' id='radios-${qId}'>${question.options.map(opt => `<div class='govgr-radios__item'><label class='govgr-label govgr-radios__label'>${opt}<input class='govgr-radios__input' type='radio' name='question-option' value='${opt}' /></label></div>`).join('')}</div></div>`;
    }
    $(".question-container").html(qElem);
  }

  function determineResult(answers) {
    var positive = answers[3] === "Ναι" && answers[4] === "Όχι" && answers[5] === "Ναι" && answers[6] === "Όχι" && answers[7] === "Ναι" && answers[8] === "Όχι" && answers[9] === "Ναι" && answers[10] === "Όχι";
    var negative = answers[4] === "Ναι" && answers[3] === "Όχι"&& answers[5] === "Όχι" && answers[6] === "Ναι" && answers[7] === "Όχι" && answers[8] === "Ναι" && answers[9] === "Όχι" && answers[10] === "Ναι";
    var sendMinistry = answers[2] === "Ναι";

    if (positive && !negative && !sendMinistry) return "positive";
    else if (!positive && negative && !sendMinistry) return "negative";
    else if (sendMinistry) return "ministry";
    else return "mixed";
  }

  function submitForm() {
    const resultWrapper = document.createElement("div");
    resultWrapper.setAttribute("id", "resultWrapper");
    const evidenceList = document.createElement("ol");
    evidenceList.setAttribute("id", "evidences");

    var answers = [];
    for (var i = 0; i < totalQuestions; i++) {
      answers.push(sessionStorage.getItem("answer_" + i));
    }

    var resultType = determineResult(answers);
    var titleText = "";
    if (currentLanguage === "greek") {
      if (resultType === "positive") titleText = "Θετική εισήγηση μεταγραφής";
      else if (resultType === "negative") titleText = "Αρνητική εισήγηση μεταγραφής";
      else if (resultType === "ministry") titleText = "Αποστολή αιτήματος προς Υπουργείο Παιδείας";
      else titleText = "Δεν υπάρχει σαφές αποτέλεσμα";
    } else {
      if (resultType === "positive") titleText = "Positive recommendation";
      else if (resultType === "negative") titleText = "Negative recommendation";
      else if (resultType === "ministry") titleText = "Request to Ministry of Education";
      else titleText = "No clear outcome";
    }

    resultWrapper.innerHTML = `<h1 class='answer'>${titleText}</h1>`;
    $(".question-container").html(resultWrapper);

    $(".question-container").append(evidenceList);
    if (resultType === "positive") getEvidencesById(9); // θετικά δικαιολογητικά
    else if (resultType === "negative") getEvidencesById(10); // αρνητικά δικαιολογητικά
    else if (resultType === "ministry") getEvidencesById(3); // προς Υπουργείο

    hideFormBtns();
  }

  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selected = $('input[name="question-option"]:checked').val();
      userAnswers[currentQuestion] = selected;
      sessionStorage.setItem("answer_" + currentQuestion, selected);
      if (currentQuestion + 1 === totalQuestions) submitForm();
      else {
        currentQuestion++;
        loadQuestion(currentQuestion, true);
        if (currentQuestion + 1 === totalQuestions) $(this).text("Υποβολή");
      }
    } else loadQuestion(currentQuestion, false);
  });

  $("#backButton").click(function () {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion(currentQuestion, true);
      var answer = userAnswers[currentQuestion];
      if (answer) $('input[name="question-option"][value="' + answer + '"]').prop("checked", true);
    }
  });

  $("#startBtn").click(function () {
    $("#intro").html("");
    $("#languageBtn").hide();
    $("#questions-btns").show();
  });

  $("#languageBtn").click(function () {
    currentLanguage = currentLanguage === "greek" ? "english" : "greek";
    if (currentQuestion >= 0 && currentQuestion < totalQuestions) loadQuestion(currentQuestion, true);
  });

  $("#questions-btns").hide();

  getQuestions().then(() => getEvidences().then(() => getFaq().then(() => loadQuestion(currentQuestion, true))));
});
