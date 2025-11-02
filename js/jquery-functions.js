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
    var positive = answers[3] === "Ναι" && answers[4] === "Όχι";
    var negative = answers[4] === "Ναι" && answers[3] === "Όχι";
    var sendMinistry = answers[2] === "Ναι";

    if (positive && !negative && !sendMinistry) return "positive";
    else if (!positive && negative && !sendMinistry) return "negative";
    else if (sendMinistry) return "ministry";
    else return "mixed";
  }

  function submitForm() {
    const resultWrapper = document.createElement("div");
    resultWrapper.setAttribute("id", "resultWrapper");

    // Πάρε όλες τις απαντήσεις από sessionStorage
    let allAnswers = [];
    for (let i = 0; i < totalQuestions; i++) {
        allAnswers.push(sessionStorage.getItem("answer_" + i)); // "Ναι" ή "Όχι"
    }

    // Ορισμός θετικών και αρνητικών ερωτήσεων
    const positiveQuestions = [3, 5, 7, 9]; // σχέδιο θετικής, υπογραφές, πρωτοκόλληση θετικής
    const negativeQuestions = [4, 6, 8, 10]; // σχέδιο αρνητικής, υπογραφές, πρωτοκόλληση αρνητικής
    const ministryQuestion = 2; // Υπουργείο

    // Έλεγχος κατάστασης
    let isPositive = positiveQuestions.every(q => allAnswers[q] === "Ναι") &&
                     negativeQuestions.every(q => allAnswers[q] === "Όχι");

    let isNegative = negativeQuestions.every(q => allAnswers[q] === "Ναι") &&
                     positiveQuestions.every(q => allAnswers[q] === "Όχι");

    let isMinistry = allAnswers[ministryQuestion] === "Ναι";

    let finalResult = "";

    if (isPositive) {
        finalResult = currentLanguage === "greek"
            ? "Θετική εισήγηση μεταγραφής"
            : "Positive transcription recommendation";
    } else if (isNegative) {
        finalResult = currentLanguage === "greek"
            ? "Αρνητική εισήγηση μεταγραφής"
            : "Negative transcription recommendation";
    } else if (isMinistry) {
        finalResult = currentLanguage === "greek"
            ? "Αποστολή αιτήματος προς Υπουργείο Παιδείας"
            : "Submission to Ministry of Education";
    } else {
        finalResult = currentLanguage === "greek"
            ? "Δεν υπάρχει σαφές αποτέλεσμα (ανάμικτες απαντήσεις)"
            : "No clear result (mixed answers)";
    }

    // Εμφάνιση αποτελέσματος
    const titleText = currentLanguage === "greek" ? "Η διαδικασία ολοκληρώθηκε!" : "The process is completed!";
    resultWrapper.innerHTML = `<h1 class='answer'>${titleText}</h1>
                               <h3 class='answer'>${finalResult}</h3>`;
    $(".question-container").html(resultWrapper);

    // Προσθήκη λίστας δικαιολογητικών (προαιρετικό)
    const evidenceListElement = document.createElement("ol");
    evidenceListElement.setAttribute("id", "evidences");
    $(".question-container").append(evidenceListElement);

    // Φόρτωσε τα δικαιολογητικά για όλες τις απαντήσεις
    retrieveAnswers();

    hideFormBtns();
}
