// ResearchHive frontend
// Project data is loaded from and saved to our backend API.


const API_URL = "http://localhost:5000/api/projects";
let projects = [];
let selectedProjectId = null;
let savedPaperCount = 0;
let toastTimer;

const dashboardView = document.getElementById("dashboardView");
const projectsView = document.getElementById("projectsView");
const projectModal = document.getElementById("projectModal");
const detailModal = document.getElementById("detailModal");
const projectForm = document.getElementById("projectForm");
const topicInput = document.getElementById("topicInput");
const descriptionInput = document.getElementById("descriptionInput");
const categoryInput = document.getElementById("categoryInput");

async function loadProjects() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Could not load projects");
    }

    projects = await response.json();
    renderProjects();
    await loadSavedPaperCount();
  } catch (error) {
    console.error("Could not load projects:", error);
    showToast("Could not connect to the backend.");
  }
}

async function loadSavedPaperCount() {
  try {
    const results = await Promise.all(
      projects.map(async (project) => {
        const response = await fetch(
          `http://localhost:5000/api/projects/${project.id}/papers`
        );

        if (!response.ok) {
          throw new Error("Could not count saved papers");
        }

        const papers = await response.json();
        return papers.length;
      })
    );

    savedPaperCount = results.reduce(
      (total, count) => total + count,
      0
    );

    document.getElementById("statSaved").textContent =
      savedPaperCount;
  } catch (error) {
    console.error("Could not count saved papers:", error);
  }
}

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openProjectModal() {
  projectForm.reset();
  projectModal.showModal();
  setTimeout(() => topicInput.focus(), 50);
}

function closeProjectModal() {
  projectModal.close();
}


async function createProject(event) {
  event.preventDefault();

  const topic = topicInput.value.trim();

  if (!topic) {
    topicInput.focus();
    return;
  }

  const project = {
    title: topic,
    research_question: descriptionInput.value.trim()
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      throw new Error("Could not create project");
    }

    await loadProjects();
    closeProjectModal();
    showToast("Project saved to the database!");
  } catch (error) {
    console.error("Could not create project:", error);
    showToast("Could not save project. Check the backend.");
  }
}



function renderProjectCard(project) {
  const topic = project.title;
  const description = project.research_question || "";
  const category = project.category || "Other";
  const dateValue = project.created_at || project.createdAt;

  const safeTopic = escapeHTML(topic);
  const safeDescription = escapeHTML(description || "No description added yet.");
  const safeCategory = escapeHTML(category);
  const date = formatDate(dateValue);

  return `
    <article class="project-card" tabindex="0" role="button"
      aria-label="Open project: ${safeTopic}"
      data-project-id="${escapeHTML(project.id)}"
      style="--card-tint:${getTint(category)}">
      <div class="card-top">
        <span class="category-pill">${safeCategory}</span>
        <span class="card-date">${date}</span>
      </div>
      <h3>${safeTopic}</h3>
      <p>${safeDescription}</p>
      <div class="card-bottom">
        <span><i class="status-dot"></i>${escapeHTML(project.status || "Created")}</span>
        <span class="open-arrow">↗</span>
      </div>
    </article>`;
}


async function getSavedResearch(projectId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/projects/${projectId}/papers`
    );

    if (!response.ok) {
      throw new Error("Could not load saved research");
    }

    return await response.json();
  } catch (error) {
    console.error("Could not load research:", error);
    return [];
  }
}

async function saveResearch(projectId, papers) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/projects/${projectId}/papers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ papers })
      }
    );

    if (!response.ok) {
      throw new Error("Could not save research");
    }

    return true;
  } catch (error) {
    console.error("Could not save research:", error);
    return false;
  }
}

function renderResearchPapers(papers) {
  const resultsContainer = document.getElementById("researchResults");

  resultsContainer.innerHTML = papers.map((paper) => {
    const authors = (paper.authors || []).join(", ") ||
      "Authors unavailable";
    const year = paper.year || "Year unavailable";
    const abstract = paper.abstract || "Abstract unavailable.";

    const url = paper.url || paper.doi;
    let sourceLink = "";

    if (url && /^https?:\/\//i.test(url)) {
      sourceLink = `
        <a href="${escapeHTML(url)}" target="_blank"
          rel="noopener noreferrer">View source ↗</a>
      `;
    }

    return `
      <article class="paper-card">
        <h4>${escapeHTML(paper.title || "Untitled paper")}</h4>
        <p><strong>Year:</strong> ${escapeHTML(year)}</p>
        <p><strong>Authors:</strong> ${escapeHTML(authors)}</p>
        <p>${escapeHTML(abstract)}</p>
        ${sourceLink}
      </article>
    `;
  }).join("");
}


function getTint(category) {
  const tints = {
    "Artificial Intelligence": "#eeeaff",
    "Computer Science": "#e7efff",
    "Data Science": "#e4f7f0",
    "Healthcare": "#ffe9ef",
    "Environment": "#e3f4e7",
    "Agriculture": "#fff0dc",
    "Other": "#f0edff"
  };
  return tints[category] || "#f0edff";
}

function renderProjects() {
  document.getElementById("projectCount").textContent = projects.length;
  document.getElementById("statProjects").textContent = projects.length;
  document.getElementById("statSaved").textContent = savedPaperCount;

  const recentContainer = document.getElementById("recentProjects");
  const emptyState = document.getElementById("emptyState");
  recentContainer.innerHTML = projects.slice(0, 3).map(renderProjectCard).join("");
  emptyState.classList.toggle("hidden", projects.length > 0);
  recentContainer.classList.toggle("hidden", projects.length === 0);

  renderAllProjects();
}


function renderAllProjects() {
  const searchText = document.getElementById("projectSearch").value.trim().toLowerCase();

  const filtered = projects.filter((project) =>
    (project.title || "").toLowerCase().includes(searchText) ||
    (project.category || "").toLowerCase().includes(searchText) ||
    (project.research_question || "").toLowerCase().includes(searchText)
  );

  document.getElementById("allProjects").innerHTML =
    filtered.map(renderProjectCard).join("");

  document.getElementById("resultsLabel").textContent =
    `${filtered.length} ${filtered.length === 1 ? "project" : "projects"}`;

  document.getElementById("projectsEmpty").classList.toggle("hidden", filtered.length > 0);
  document.getElementById("allProjects").classList.toggle("hidden", filtered.length === 0);
}


async function openProjectDetails(projectId) {
  const project = projects.find(
    (item) => String(item.id) === String(projectId)
  );

  if (!project) return;

  selectedProjectId = project.id;

  document.getElementById("detailCategory").textContent =
    project.category || "Other";

  document.getElementById("detailTitle").textContent =
    project.title;

  document.getElementById("detailDescription").textContent =
    project.research_question || "No research question added yet.";

  document.getElementById("detailDate").textContent =
    formatDate(project.created_at || project.createdAt);

  const message = document.getElementById("researchMessage");
  const results = document.getElementById("researchResults");

  message.textContent = "Loading saved research...";
  results.innerHTML = "";

  detailModal.showModal();

  const savedPapers = await getSavedResearch(project.id);

  // Make sure the user hasn't switched to another project
  if (String(selectedProjectId) !== String(project.id)) return;

  if (savedPapers.length > 0) {
    message.textContent =
      `Your ${savedPapers.length} saved research sources.`;

    renderResearchPapers(savedPapers);
  } else {
    message.textContent = "No saved research yet. Search for papers to get started.";
  }
}



async function searchResearch() {
  const project = projects.find(
    (item) => String(item.id) === String(selectedProjectId)
  );

  if (!project) {
    showToast("Please open a research project first.");
    return;
  }

  const button = document.getElementById("searchResearchBtn");
  const message = document.getElementById("researchMessage");

  button.disabled = true;
  button.textContent = "Searching...";
  message.textContent = "Finding academic sources...";

  try {
    const response = await fetch(
      `http://localhost:5000/api/research?topic=${encodeURIComponent(project.title)}`
    );

    if (!response.ok) {
      throw new Error("Research search failed");
    }

    const data = await response.json();
    const papers = data.papers || [];

    if (papers.length === 0) {
      message.textContent =
        "No research sources found. Try another topic.";
      return;
    }

    const saved = await saveResearch(project.id, papers);

    if (!saved) {
      throw new Error("Could not save research papers to the database");
    }

    await loadSavedPaperCount();

    renderResearchPapers(papers);

    message.textContent =
      `Found ${papers.length} research sources. Saved to the database.`;

    showToast("Research papers saved successfully!");

  } catch (error) {
    console.error("Research search failed:", error);

    message.textContent =
      "Could not search or save research papers. Check the backend.";
  } finally {
    button.disabled = false;
    button.textContent = "Search Research Papers";
  }
}


async function deleteSelectedProject() {
  if (!selectedProjectId) return;

  const project = projects.find(
    (item) => String(item.id) === String(selectedProjectId)
  );

  const confirmed = window.confirm(
    `Delete "${project ? project.title : "this project"}"?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${API_URL}/${selectedProjectId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error("Could not delete project");
    }

    detailModal.close();
    selectedProjectId = null;
    await loadProjects();
    showToast("Project deleted.");
  } catch (error) {
    console.error("Could not delete project:", error);
    showToast("Could not delete project. Check the backend.");
  }
}


function showView(viewName) {
  const isDashboard = viewName === "dashboard";
  dashboardView.classList.toggle("hidden", !isDashboard);
  projectsView.classList.toggle("hidden", isDashboard);
  document.getElementById("breadcrumbCurrent").textContent = isDashboard ? "Dashboard" : "My projects";

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (!isDashboard) renderAllProjects();
  document.getElementById("sidebar").classList.remove("open");
}

document.getElementById("newProjectBtn").addEventListener("click", openProjectModal);
document.getElementById("emptyCreateBtn").addEventListener("click", openProjectModal);
document.getElementById("projectsCreateBtn").addEventListener("click", openProjectModal);
document.getElementById("projectsEmptyCreate").addEventListener("click", openProjectModal);
document.getElementById("closeModal").addEventListener("click", closeProjectModal);
document.getElementById("cancelModal").addEventListener("click", closeProjectModal);
document.getElementById("viewAllBtn").addEventListener("click", () => showView("projects"));
document.getElementById("projectSearch").addEventListener("input", renderAllProjects);
document.getElementById("closeDetail").addEventListener("click", () => detailModal.close());
document.getElementById("closeDetailBottom").addEventListener("click", () => detailModal.close());
document.getElementById("deleteProjectBtn").addEventListener("click", deleteSelectedProject);
document.getElementById("helpBtn").addEventListener("click", () => {
  showToast("Create a project to save a research topic. AI features come later.");
});
document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

projectForm.addEventListener("submit", createProject);
document.getElementById("searchResearchBtn")
  .addEventListener("click", searchResearch);


// Event delegation lets cards be opened even after they are re-rendered.
document.addEventListener("click", (event) => {
  const card = event.target.closest(".project-card");
  if (card) openProjectDetails(card.dataset.projectId);
});
document.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("project-card")) {
    event.preventDefault();
    openProjectDetails(event.target.dataset.projectId);
  }
});

// Clicking outside the modal form closes it.
projectModal.addEventListener("click", (event) => {
  if (event.target === projectModal) closeProjectModal();
});
detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) detailModal.close();
});

loadProjects();


