
const axios = require("axios");
const cors = require("cors");
const express = require("express");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors({
    origin: "http://127.0.0.1:3000"
}));

app.use(express.json());

// Check whether the backend is running
app.get("/", (req, res) => {
    res.json({
        message: "ResearchHive backend is running!",
        status: "online"
    });
});

// Get all projects
app.get("/api/projects", (req, res) => {
    const projects = db.prepare(
        "SELECT * FROM projects ORDER BY id DESC"
    ).all();

    res.json(projects);
});

// Create a project
app.post("/api/projects", (req, res) => {
    const { title, research_question } = req.body;

    if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({
            error: "Project title is required"
        });
    }

    const result = db.prepare(`
        INSERT INTO projects (title, research_question)
        VALUES (?, ?)
    `).run(
        title.trim(),
        typeof research_question === "string"
            ? research_question
            : ""
    );

    const project = db.prepare(
        "SELECT * FROM projects WHERE id = ?"
    ).get(result.lastInsertRowid);

    res.status(201).json(project);
});

// Delete a project
app.delete("/api/projects/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            error: "Invalid project ID"
        });
    }

    const result = db.prepare(
        "DELETE FROM projects WHERE id = ?"
    ).run(id);

    if (result.changes === 0) {
        return res.status(404).json({
            error: "Project not found"
        });
    }

    res.json({
        message: "Project deleted successfully"
    });
});

// Get saved research papers for a project
app.get("/api/projects/:id/papers", (req, res) => {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId < 1) {
        return res.status(400).json({
            error: "Invalid project ID"
        });
    }

    const project = db.prepare(
        "SELECT id FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        return res.status(404).json({
            error: "Project not found"
        });
    }

    const papers = db.prepare(`
        SELECT id, project_id, title, authors, year,
               doi, url, abstract, created_at
        FROM papers
        WHERE project_id = ?
        ORDER BY id DESC
    `).all(projectId);

    res.json(papers.map((paper) => ({
        ...paper,
        authors: JSON.parse(paper.authors || "[]")
    })));
});

// Save research papers for a project
app.post("/api/projects/:id/papers", (req, res) => {
    const projectId = Number(req.params.id);
    const { papers } = req.body;

    if (!Number.isInteger(projectId) || projectId < 1) {
        return res.status(400).json({
            error: "Invalid project ID"
        });
    }

    if (!Array.isArray(papers)) {
        return res.status(400).json({
            error: "Papers must be provided as an array"
        });
    }

    if (papers.length > 50) {
        return res.status(400).json({
            error: "A maximum of 50 papers can be saved at once"
        });
    }

    const project = db.prepare(
        "SELECT id FROM projects WHERE id = ?"
    ).get(projectId);

    if (!project) {
        return res.status(404).json({
            error: "Project not found"
        });
    }

    for (const paper of papers) {
        if (!paper || typeof paper.title !== "string" ||
            !paper.title.trim()) {
            return res.status(400).json({
                error: "Every paper must have a title"
            });
        }

        if (paper.authors !== undefined &&
            !Array.isArray(paper.authors)) {
            return res.status(400).json({
                error: "Paper authors must be an array"
            });
        }
    }

    const savePapers = db.transaction(() => {
        // Replace this project's previously saved search results
        db.prepare(
            "DELETE FROM papers WHERE project_id = ?"
        ).run(projectId);

        const insert = db.prepare(`
            INSERT INTO papers
                (project_id, title, authors, year, doi, url, abstract)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const paper of papers) {
            insert.run(
                projectId,
                paper.title.trim(),
                JSON.stringify(paper.authors || []),
                Number.isInteger(paper.year) ? paper.year : null,
                typeof paper.doi === "string" ? paper.doi : null,
                typeof paper.url === "string" ? paper.url : null,
                typeof paper.abstract === "string" ? paper.abstract : ""
            );
        }
    });

    savePapers();

    res.status(201).json({
        message: "Research papers saved successfully",
        count: papers.length
    });
});

// Search OpenAlex for research papers
app.get("/api/research", async (req, res) => {
    const topic = typeof req.query.topic === "string"
        ? req.query.topic.trim()
        : "";

    if (!topic) {
        return res.status(400).json({
            error: "Please provide a research topic."
        });
    }

    try {
        const response = await axios.get(
            "https://api.openalex.org/works",
            {
                params: {
                    search: topic,
                    per_page: 10,
                    sort: "relevance_score:desc"
                },
                timeout: 15000
            }
        );

        const papers = response.data.results.map((paper) => ({
            title: paper.title || "Untitled paper",
            authors: (paper.authorships || [])
                .slice(0, 5)
                .map((item) => item.author?.display_name)
                .filter(Boolean),
            year: paper.publication_year,
            doi: paper.doi || null,
            url: paper.doi ||
                paper.primary_location?.landing_page_url || null,
            abstract: paper.abstract_inverted_index
                ? Object.entries(paper.abstract_inverted_index)
                    .reduce((words, [word, positions]) => {
                        for (const position of positions) {
                            words[position] = word;
                        }
                        return words;
                    }, [])
                    .filter(Boolean)
                    .join(" ")
                : "Abstract not available from this source."
        }));

        res.json({
            topic,
            count: papers.length,
            papers
        });
    } catch (error) {
        console.error("Research search failed:", error.message);

        res.status(502).json({
            error: "Could not retrieve research papers. Please try again."
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(
        `ResearchHive backend running at http://localhost:${PORT}`
    );
});
