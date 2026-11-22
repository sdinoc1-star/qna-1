const STORAGE_KEY = "schoolQuestionBoard";

let questions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let selectedId = null;

// HTML 특수문자 처리 (안전한 화면 출력)
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// 날짜 표시
function formatDate(date) {
    return new Date(date).toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    });
}

// 데이터 저장
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions));
}

// 통계 업데이트
function updateStats() {
    const totalQuestions = questions.length;

    const totalAnswers = questions.reduce(
        (sum, q) => sum + q.answers.length, 0
    );

    const waitingQuestions = questions.filter(
        q => q.answers.length === 0
    ).length;

    document.getElementById("totalQuestions").textContent =
        totalQuestions;

    document.getElementById("totalAnswers").textContent =
        totalAnswers;

    document.getElementById("waitingQuestions").textContent =
        waitingQuestions;
}

// 질문 목록 출력
function renderQuestions() {
    const list = document.getElementById("questionList");

    const keyword = document.getElementById("searchInput")
        .value.trim().toLowerCase();

    const subject = document.getElementById("filterSubject").value;

    const sortOrder = document.getElementById("sortOrder").value;

    let filtered = questions.filter(q => {
        const matchSubject =
            subject === "전체" || q.subject === subject;

        const matchKeyword =
            q.title.toLowerCase().includes(keyword) ||
            q.content.toLowerCase().includes(keyword);

        return matchSubject && matchKeyword;
    });

    // 정렬
    if (sortOrder === "latest") {
        filtered.sort((a, b) => b.id.localeCompare(a.id));
    } else {
        filtered.sort((a, b) =>
            b.answers.length - a.answers.length ||
            b.id.localeCompare(a.id)
        );
    }

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="empty-list">
                <div style="font-size:35px;">🔍</div>
                <p>등록된 질문이 없습니다.</p>
                <p>첫 번째 질문을 등록해 보세요!</p>
            </div>
        `;

        if (selectedId !== null) {
            selectedId = null;
            renderDetail();
        }

        return;
    }

    list.innerHTML = filtered.map(q => `
        <article class="question-item
            ${selectedId === q.id ? "active" : ""}"
            data-id="${escapeHTML(q.id)}">

            <div class="question-top">
                <span class="subject-tag">
                    ${escapeHTML(q.subject)}
                </span>

                <span class="status-tag
                    ${q.answers.length > 0 ? "complete" : ""}">
                    ${q.answers.length > 0 ? "답변 완료" : "답변 대기"}
                </span>
            </div>

            <h3>${escapeHTML(q.title)}</h3>

            <p>${escapeHTML(q.author)} · ${formatDate(q.date)}</p>

            <div class="question-meta">
                <span>💬 답변 ${q.answers.length}개</span>
                <span>질문 게시글</span>
            </div>
        </article>
    `).join("");

    renderDetail();
}

// 질문 상세 및 답변 출력
function renderDetail() {
    const panel = document.getElementById("detailPanel");

    const q = questions.find(item => item.id === selectedId);

    if (!q) {
        panel.innerHTML = `
            <div class="empty-detail">
                <div class="empty-icon">📖</div>
                <h3>질문을 선택해 주세요</h3>
                <p>질문을 클릭하면 상세 내용과 답변을 확인할 수 있습니다.</p>
            </div>
        `;
        return;
    }

    const answersHTML = q.answers.length
        ? q.answers.map(a => `
            <div class="answer-item">
                <button class="answer-delete"
                    data-answer-id="${escapeHTML(a.id)}"
                    title="답변 삭제">삭제</button>

                <strong>👤 ${escapeHTML(a.author)}</strong>

                <p>${escapeHTML(a.content)}</p>

                <small>${formatDate(a.date)}</small>
            </div>
        `).join("")
        : `<p class="empty-list">아직 답변이 없습니다. 첫 답변을 작성해 보세요!</p>`;

    panel.innerHTML = `
        <div class="detail-subject">
            <span class="subject-tag">
                ${escapeHTML(q.subject)}
            </span>
        </div>

        <h2 class="detail-title">
            ${escapeHTML(q.title)}
        </h2>

        <div class="detail-info">
            작성자: ${escapeHTML(q.author)}
            &nbsp; | &nbsp;
            ${formatDate(q.date)}
        </div>

        <div class="detail-content">
            ${escapeHTML(q.content)}
        </div>

        <button class="delete-btn" id="deleteQuestion">
            질문 삭제
        </button>

        <div class="answer-section">
            <h3>💬 답변 (${q.answers.length})</h3>

            ${answersHTML}

            <div class="answer-form">
                <h3>답변 작성하기</h3>

                <form id="answerForm">
                    <input type="text" id="answerAuthor"
                        placeholder="작성자 이름" maxlength="20" required>

                    <textarea id="answerContent" rows="4"
                        placeholder="답변 내용을 입력하세요."
                        maxlength="3000" required></textarea>

                    <button type="submit" class="answer-btn">
                        답변 등록하기
                    </button>
                </form>
            </div>
        </div>
    `;
}

// 질문 등록
document.getElementById("questionForm")
    .addEventListener("submit", function(e) {
        e.preventDefault();

        const subject = document.getElementById("subject").value;
        const author = document.getElementById("author").value.trim();
        const title = document.getElementById("questionTitle").value.trim();
        const content = document.getElementById("questionContent").value.trim();

        if (!subject || !author || !title || !content) {
            alert("모든 항목을 입력해 주세요.");
            return;
        }

        const question = {
            id: crypto.randomUUID(),
            subject,
            author,
            title,
            content,
            date: new Date().toISOString(),
            answers: []
        };

        questions.push(question);

        selectedId = question.id;

        saveData();
        updateStats();
        renderQuestions();

        this.reset();

        alert("질문이 등록되었습니다!");
    });

// 질문 선택
document.getElementById("questionList")
    .addEventListener("click", function(e) {
        const item = e.target.closest(".question-item");

        if (!item) return;

        selectedId = item.dataset.id;

        renderQuestions();
    });

// 상세 화면의 삭제 및 답변 등록 처리
document.getElementById("detailPanel")
    .addEventListener("submit", function(e) {
        if (e.target.id !== "answerForm") return;

        e.preventDefault();

        const author = document.getElementById("answerAuthor")
            .value.trim();

        const content = document.getElementById("answerContent")
            .value.trim();

        if (!author || !content) {
            alert("작성자와 답변 내용을 입력해 주세요.");
            return;
        }

        const q = questions.find(item => item.id === selectedId);

        if (!q) return;

        q.answers.push({
            id: crypto.randomUUID(),
            author,
            content,
            date: new Date().toISOString()
        });

        saveData();
        updateStats();
        renderQuestions();

        alert("답변이 등록되었습니다!");
    });

// 질문 및 답변 삭제
document.getElementById("detailPanel")
    .addEventListener("click", function(e) {

        // 질문 삭제
        if (e.target.id === "deleteQuestion") {
            if (!confirm("이 질문과 모든 답변을 삭제할까요?")) {
                return;
            }

            questions = questions.filter(
                q => q.id !== selectedId
            );

            selectedId = null;

            saveData();
            updateStats();
            renderQuestions();

            alert("질문이 삭제되었습니다.");
            return;
        }

        // 답변 삭제
        const answerButton = e.target.closest(".answer-delete");

        if (answerButton) {
            if (!confirm("이 답변을 삭제할까요?")) return;

            const q = questions.find(
                item => item.id === selectedId
            );

            if (!q) return;

            q.answers = q.answers.filter(
                a => a.id !== answerButton.dataset.answerId
            );

            saveData();
            updateStats();
            renderQuestions();
        }
    });

// 검색 기능
document.getElementById("searchInput")
    .addEventListener("input", renderQuestions);

// 교과목 필터
document.getElementById("filterSubject")
    .addEventListener("change", renderQuestions);

// 정렬 기능
document.getElementById("sortOrder")
    .addEventListener("change", renderQuestions);

// 최초 실행
updateStats();
renderQuestions();