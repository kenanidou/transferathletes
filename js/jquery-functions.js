$("document").ready(function () {
  var currentQuestion = 0;
  var totalQuestions = 0;
  var userAnswers = {};
  var all_questions;
  var all_evidences;
  var faq;
  var currentLanguage = "greek"; // Αρχική γλώσσα

  function hideFormBtns() {
    $("#nextQuestion").hide();
    $("#backButton").hide();
  }

  function getQuestions() {
    return fetch("question-utils/all-questions.json")
      .then((response) => response.json())
      .then((data) => {
        all_questions = data;
        totalQuestions = data.length;
      })
      .catch((error) => {
        console.error("Failed to fetch all-questions:", error);
        $(".question-container").html("Error: Failed to fetch all-questions.json.");
        hideFormBtns();
      });
  }

  function getEvidences() {
    return fetch("question-utils/cpsv.json")
      .then((response) => response.json())
      .then((data) => {
        all_evidences = data;
      })
      .catch((error) => {
        console.error("Failed to fetch cpsv:", error);
        $(".question-container").html("Error: Failed to fetch cpsv.json.");
        hideFormBtns();
      });
  }

  function getFaq() {
    return fetch("question-utils/faq.json")
      .then((response) => response.json())
      .then((data) => {
        faq = data;
      })
      .catch((error) => {
        console.error("Failed to fetch faq:", error);
        $(".question-container").html("Error: Failed to fetch faq.json.");
      });
  }

  function getEvidencesById(id) {
    var selectedEvidence = all_evidences.PublicService.evidence.find(
      (evidence) => evidence.id === id
    );

    if (selectedEvidence) {
      const evidenceListElement = document.getElementById("evidences");
      selectedEvidence.evs.forEach((evsItem) => {
        const listItem = document.createElement("li");
        listItem.textContent = evsItem.name;
        evidenceListElement.appendChild(listItem);
      });
    } else {
      console.log(`Evidence with ID '${id}' not found.`);
    }
  }

  function loadQuestion(questionId, noError) {
    $("#nextQuestion").show();
    if (currentQuestion > 0) $("#backButton").show();

    var question = all_questions[questionId];
    var questionElement = document.createElement("div");

    if (noError) {
      questionElement.innerHTML = `
        <div class='govgr-field'>
          <fieldset class='govgr-fieldset'>
            <legend class='govgr-fieldset__legend govgr-heading-l'>
              ${question.question}
            </legend>
            <div class='govgr-radios' id='radios-${questionId}'>
              ${question.options
                .map(
                  (option) => `
                    <div class='govgr-radios__item'>
                      <label class='govgr-label govgr-radios__label'>
                        ${option}
                        <input class='govgr-radios__input' type='radio' name='question-option' value='${option}' />
                      </label>
                    </div>
                  `
                )
                .join("")}
            </div>
          </fieldset>
        </div>`;
    } else {
      questionElement.innerHTML = `
        <div class='govgr-field govgr-field__error'>
          <legend class='govgr-fieldset__legend govgr-heading-l'>${question.question}</legend>
          <p class='govgr-error-message'>Πρέπει να επιλέξετε μια απάντηση</p>
          <div class='govgr-radios' id='radios-${questionId}'>
            ${question.options
              .map(
                (option) => `
                <div class='govgr-radios__item'>
                  <label class='govgr-label govgr-radios__label'>
                    ${option}
                    <input class='govgr-radios__input' type='radio' name='question-option' value='${option}' />
                  </label>
                </div>
              `
              )
              .join("")}
          </div>
        </div>`;
    }

    $(".question-container").html(questionElement);
  }

  function retrieveAnswers() {
    getEvidencesById(1);
    getEvidencesById(2);
    getEvidencesById(3);
    getEvidencesById(4);
  }

  function submitForm() {
    const resultWrapper = document.createElement("div");
    resultWrapper.setAttribute("id", "resultWrapper");

    // Βήματα για λογική εισήγησης
    const positiveSteps = [4, 6, 8, 10];
    const negativeSteps = [5, 7, 9, 11];
    const ministryStep = 3;

    let allPositiveYes = positiveSteps.every(i => userAnswers[i] === "Ναι");
    let allPositiveNo = positiveSteps.every(i => userAnswers[i] === "Όχι");

    let allNegativeYes = negativeSteps.every(i => userAnswers[i] === "Ναι");
    let allNegativeNo = negativeSteps.every(i => userAnswers[i] === "Όχι");

    let ministryYes = userAnswers[ministryStep] === "Ναι";

    let finalResult = "";

    if (ministryYes) {
        finalResult = "Αποστολή αιτήματος προς Υπουργείο Παιδείας: Η περίπτωση χρειάζεται έγκριση/εισήγηση από το Υπουργείο.";
    } else if (allPositiveYes && allNegativeNo) {
        finalResult = "Θετική εισήγηση μεταγραφής: Πληροί όλες τις προϋποθέσεις. Προχωρά στη δημιουργία θετικού εγγράφου και πρωτοκόλληση.";
    } else if (allNegativeYes && allPositiveNo) {
        finalResult = " Αρνητική εισήγηση μεταγραφής: Λείπουν δικαιολογητικά ή δεν καλύπτονται οι προϋποθέσεις. Προχωρά στη δημιουργία αρνητικού εγγράφου.";
    } else {
        finalResult = " Μικτή ή μη αποφασισμένη περίπτωση: Δεν μπορεί να εξαχθεί αποτέλεσμα.";
    }

    resultWrapper.innerHTML = `<h1 class='answer'>Η διαδικασία ολοκληρώθηκε!</h1>
                               <h4 class='answer'>${finalResult}</h4>`;

    $(".question-container").html(resultWrapper);

    // Εμφάνιση δικαιολογητικών
    const evidenceListElement = document.createElement("ol");
    evidenceListElement.setAttribute("id", "evidences");
    $(".question-container").append(
      "<br /><h5 class='answer'>Τα δικαιολογητικά που πρέπει να προσκομίσετε είναι:</h5><br />"
    );
    $(".question-container").append(evidenceListElement);

    retrieveAnswers();
    hideFormBtns();
  }

  $("#nextQuestion").click(function () {
    if ($(".govgr-radios__input").is(":checked")) {
      var selectedOption = $('input[name="question-option"]:checked').val();
      userAnswers[currentQuestion] = selectedOption;
      sessionStorage.setItem("answer_" + currentQuestion, selectedOption);

      if (currentQuestion + 1 === totalQuestions) {
        submitForm();
      } else {
        currentQuestion++;
        loadQuestion(currentQuestion, true);
        if (currentQuestion + 1 === totalQuestions) $("#nextQuestion").text("Υποβολή");
      }
    } else {
      loadQuestion(currentQuestion, false);
    }
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

  getQuestions().then(() => {
    getEvidences().then(() => {
      getFaq().then(() => {
        loadQuestion(currentQuestion, true);
      });
    });
  });
});
