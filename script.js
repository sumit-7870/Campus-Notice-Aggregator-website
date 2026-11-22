// ===============================
//  Campus Notice Aggregator
//  Basic JavaScript (beginner level)
// ===============================

// ----- 1. Get the elements from the page -----
var form = document.getElementById("notice-form");
var titleInput = document.getElementById("title");
var descriptionInput = document.getElementById("description");
var categoryInput = document.getElementById("category");
var departmentInput = document.getElementById("department");
var dateInput = document.getElementById("date");
var statusInput = document.getElementById("status");

var saveButton = document.getElementById("save-button");
var cancelButton = document.getElementById("cancel-button");
var formTitle = document.getElementById("form-title");
var messageBox = document.getElementById("message");

var searchInput = document.getElementById("search");
var filterCategory = document.getElementById("filter-category");
var filterStatus = document.getElementById("filter-status");
var noticeList = document.getElementById("notice-list");
var resultCount = document.getElementById("result-count");

// ----- 2. Data -----
var notices = [];       // all notices are stored in this list
var editingId = null;   // id of the notice being edited (null = adding a new one)

// Some sample notices so the page is not empty the first time
var sampleNotices = [
  { id: 1, title: "Mid-semester exam timetable released", description: "The timetable for the mid-semester exams is now available. Check your section schedule and report 15 minutes early.", category: "Exams", department: "Examination Cell", date: "2026-11-18", status: "Published" },
  { id: 2, title: "Annual tech fest registrations open", description: "Teams of up to four students can register for coding, robotics and quiz events until the end of the month.", category: "Events", department: "Student Council", date: "2026-11-19", status: "Pending" },
  { id: 3, title: "Campus placement drive: orientation", description: "Final-year students should attend the orientation session in the main auditorium before the drive begins.", category: "Placements", department: "Training and Placement Cell", date: "2026-11-12", status: "Published" },
  { id: 4, title: "Hostel water supply maintenance", description: "Water supply will be off for two hours on Sunday morning for tank cleaning.", category: "Hostel", department: "Hostel Office", date: "2026-11-05", status: "Archived" }
];

// ----- 3. Saving and loading (browser localStorage) -----
function saveNotices() {
  localStorage.setItem("campusNotices", JSON.stringify(notices));
}

function loadNotices() {
  var saved = localStorage.getItem("campusNotices");
  if (saved) {
    notices = JSON.parse(saved);
  } else {
    notices = sampleNotices;
    saveNotices();
  }
}

// ----- 4. Small helper functions -----

// Stops text typed by a user from being read as HTML
function safeText(text) {
  var div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Shows a success or error message at the top
function showMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "message " + type;   // "message success" or "message error"
  setTimeout(function () {
    messageBox.className = "message hidden";
  }, 4000);
}

function formatDate(dateString) {
  var d = new Date(dateString);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ----- 5. Form validation -----
function showError(inputId, text) {
  document.getElementById(inputId + "-error").textContent = text;
  if (text !== "") {
    document.getElementById(inputId).classList.add("invalid");
  } else {
    document.getElementById(inputId).classList.remove("invalid");
  }
}

// Returns true if everything is filled in correctly
function validateForm() {
  var ok = true;

  if (titleInput.value.trim().length < 5) {
    showError("title", "Title must be at least 5 characters.");
    ok = false;
  } else {
    showError("title", "");
  }

  if (descriptionInput.value.trim().length < 10) {
    showError("description", "Details must be at least 10 characters.");
    ok = false;
  } else {
    showError("description", "");
  }

  if (categoryInput.value === "") {
    showError("category", "Please choose a category.");
    ok = false;
  } else {
    showError("category", "");
  }

  if (departmentInput.value.trim() === "") {
    showError("department", "Please enter the department name.");
    ok = false;
  } else {
    showError("department", "");
  }

  if (dateInput.value === "") {
    showError("date", "Please choose a date.");
    ok = false;
  } else {
    showError("date", "");
  }

  return ok;
}

// ----- 6. Clear the form / go back to "add" mode -----
function resetForm() {
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);   // today's date
  editingId = null;
  formTitle.textContent = "Add a notice";
  saveButton.textContent = "Add notice";
  cancelButton.classList.add("hidden");

  var ids = ["title", "description", "category", "department", "date"];
  for (var i = 0; i < ids.length; i++) {
    showError(ids[i], "");
  }
}

// ----- 7. Show the summary (dashboard) -----
function updateSummary() {
  var pending = 0;
  var published = 0;
  var archived = 0;
  var categoryCounts = {};

  for (var i = 0; i < notices.length; i++) {
    var n = notices[i];
    if (n.status === "Pending") pending++;
    if (n.status === "Published") published++;
    if (n.status === "Archived") archived++;

    if (categoryCounts[n.category]) {
      categoryCounts[n.category]++;
    } else {
      categoryCounts[n.category] = 1;
    }
  }

  document.getElementById("count-total").textContent = notices.length;
  document.getElementById("count-pending").textContent = pending;
  document.getElementById("count-published").textContent = published;
  document.getElementById("count-archived").textContent = archived;

  // Progress bar = published / total
  var percent = 0;
  if (notices.length > 0) {
    percent = Math.round((published / notices.length) * 100);
  }
  document.getElementById("progress-text").textContent =
    published + " of " + notices.length + " notices published (" + percent + "%)";
  document.getElementById("progress-fill").style.width = percent + "%";

  // Notices per category
  var parts = [];
  for (var name in categoryCounts) {
    parts.push(name + ": " + categoryCounts[name]);
  }
  document.getElementById("category-summary").textContent =
    parts.length > 0 ? "By category - " + parts.join(", ") : "";
}

// ----- 8. Show the list of notices (with search + filters) -----
function showNotices() {
  var searchText = searchInput.value.trim().toLowerCase();
  var category = filterCategory.value;
  var status = filterStatus.value;

  var html = "";
  var shown = 0;

  for (var i = 0; i < notices.length; i++) {
    var n = notices[i];

    // Check the filters
    if (category !== "" && n.category !== category) continue;
    if (status !== "" && n.status !== status) continue;

    // Check the search text
    var allText = (n.title + " " + n.description + " " + n.department).toLowerCase();
    if (searchText !== "" && allText.indexOf(searchText) === -1) continue;

    shown++;
    var cssClass = n.status.toLowerCase();   // pending / published / archived

    // Step tracker
    var step1 = "done";
    var step2 = (n.status === "Published" || n.status === "Archived") ? "done" : "";
    var step3 = (n.status === "Archived") ? "done" : "";

    // Button that moves the notice to the next status
    var nextButton = "";
    if (n.status === "Pending") {
      nextButton = '<button class="btn btn-main btn-small" data-action="next" data-id="' + n.id + '">Publish</button>';
    } else if (n.status === "Published") {
      nextButton = '<button class="btn btn-main btn-small" data-action="next" data-id="' + n.id + '">Archive</button>';
    }

    html += '<article class="notice ' + cssClass + '">' +
      '<div class="notice-top">' +
        '<h3>' + safeText(n.title) + '</h3>' +
        '<span class="badge ' + cssClass + '">' + n.status + '</span>' +
      '</div>' +
      '<p class="notice-meta">' + n.category + ' | ' + safeText(n.department) + ' | ' + formatDate(n.date) + '</p>' +
      '<p class="notice-text">' + safeText(n.description) + '</p>' +
      '<div class="steps">' +
        '<span class="step ' + step1 + '">Pending</span>' +
        '<span class="step ' + step2 + '">Published</span>' +
        '<span class="step ' + step3 + '">Archived</span>' +
      '</div>' +
      '<div class="notice-buttons">' +
        nextButton +
        '<button class="btn btn-light btn-small" data-action="edit" data-id="' + n.id + '">Edit</button>' +
        '<button class="btn btn-delete btn-small" data-action="delete" data-id="' + n.id + '">Delete</button>' +
      '</div>' +
    '</article>';
  }

  if (shown === 0) {
    html = '<div class="empty">No notices found. Add a notice using the form, or change your search and filters.</div>';
  }

  noticeList.innerHTML = html;
  resultCount.textContent = "Showing " + shown + " of " + notices.length + " notices";
}

// Update everything on the screen
function refreshPage() {
  updateSummary();
  showNotices();
}

// ----- 9. Add or update a notice when the form is submitted -----
form.addEventListener("submit", function (event) {
  event.preventDefault();   // stop the page from reloading

  if (!validateForm()) {
    showMessage("Please fix the highlighted fields and try again.", "error");
    return;
  }

  var data = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    category: categoryInput.value,
    department: departmentInput.value.trim(),
    date: dateInput.value,
    status: statusInput.value
  };

  if (editingId === null) {
    // Add a new notice
    data.id = Date.now();
    notices.unshift(data);   // put it at the top of the list
    showMessage("Notice added successfully.", "success");
  } else {
    // Update an existing notice
    for (var i = 0; i < notices.length; i++) {
      if (notices[i].id === editingId) {
        data.id = editingId;
        notices[i] = data;
      }
    }
    showMessage("Notice updated successfully.", "success");
  }

  saveNotices();
  resetForm();
  refreshPage();
});

cancelButton.addEventListener("click", function () {
  resetForm();
});

// ----- 10. Buttons inside the notice list (Publish / Edit / Delete) -----
noticeList.addEventListener("click", function (event) {
  var button = event.target;
  var action = button.getAttribute("data-action");
  if (action === null) return;

  var id = Number(button.getAttribute("data-id"));

  for (var i = 0; i < notices.length; i++) {
    if (notices[i].id !== id) continue;

    if (action === "next") {
      if (notices[i].status === "Pending") {
        notices[i].status = "Published";
        showMessage("Notice published.", "success");
      } else if (notices[i].status === "Published") {
        notices[i].status = "Archived";
        showMessage("Notice archived.", "success");
      }
      saveNotices();
      refreshPage();
    }

    if (action === "edit") {
      // Put the notice values back into the form
      editingId = id;
      titleInput.value = notices[i].title;
      descriptionInput.value = notices[i].description;
      categoryInput.value = notices[i].category;
      departmentInput.value = notices[i].department;
      dateInput.value = notices[i].date;
      statusInput.value = notices[i].status;

      formTitle.textContent = "Update notice";
      saveButton.textContent = "Update notice";
      cancelButton.classList.remove("hidden");
      form.scrollIntoView({ behavior: "smooth" });
    }

    if (action === "delete") {
      if (confirm("Delete this notice? This cannot be undone.")) {
        notices.splice(i, 1);
        saveNotices();
        if (editingId === id) resetForm();
        refreshPage();
        showMessage("Notice deleted.", "success");
      }
    }
    break;
  }
});

// ----- 11. Search and filters update the list while typing -----
searchInput.addEventListener("input", showNotices);
filterCategory.addEventListener("change", showNotices);
filterStatus.addEventListener("change", showNotices);

// ----- 12. Start the page -----
loadNotices();
resetForm();
refreshPage();
