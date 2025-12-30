let levelsData = [];
let filteredLevels = [];
let hasUnsavedChanges = false;
let editingLevelIndex = null;
let editingCopyIndex = null;
let editingCopyParentIndex = null;
let temporaryCopies = []; // Store copies while adding a new level
let currentPage = 1;
const itemsPerPage = 6;

// Load JSON data
async function loadLevelsData() {
    try {
        const response = await fetch('levels.json', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Failed to load levels data');
        }
        levelsData = await response.json();
        filteredLevels = levelsData;
        hasUnsavedChanges = false;
        currentPage = 1;
        displayLevels();
        updateResultsCount(filteredLevels.length);
        updatePagination();
    } catch (error) {
        console.error('Error loading levels data:', error);
        alert('Error loading levels data. Please check that levels.json exists and is valid.');
    }
}

// Display all levels
function displayLevels() {
    const container = document.getElementById('levelsList');
    const noLevels = document.getElementById('noLevels');
    const pagination = document.getElementById('pagination');
    
    if (filteredLevels.length === 0) {
        container.innerHTML = '';
        noLevels.style.display = 'block';
        pagination.style.display = 'none';
        return;
    }
    
    noLevels.style.display = 'none';
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLevels = filteredLevels.slice(startIndex, endIndex);
    
    // Find original indices for editing
    container.innerHTML = paginatedLevels.map(level => {
        const originalIndex = levelsData.findIndex(l => l.id === level.id && l.name === level.name);
        return createLevelCard(level, originalIndex);
    }).join('');
    
    // Show/hide pagination
    if (totalPages > 1) {
        pagination.style.display = 'flex';
        setTimeout(() => {
            pagination.classList.add('visible');
        }, 10);
    } else {
        pagination.style.display = 'none';
        pagination.classList.remove('visible');
    }
}

// Create HTML for a level card
function createLevelCard(level, index) {
    const approvedCount = level.copies.filter(c => c.status === 'approved').length;
    const pendingCount = level.copies.filter(c => c.status === 'pending').length;
    const rejectedCount = level.copies.filter(c => c.status === 'rejected').length;
    
    const copiesHtml = level.copies.map((copy, copyIndex) => `
        <div class="copy-card-editor">
            <div class="copy-name-editor">${escapeHtml(copy.name)}</div>
            <div class="copy-meta-editor">
                ID: ${escapeHtml(copy.id.toString())} | by ${escapeHtml(copy.creator)}
            </div>
            <span class="copy-status-badge copy-status-${copy.status}">${copy.status}</span>
            ${copy.reason ? `<div style="font-size: 0.8rem; color: #999; margin-top: 6px;">${escapeHtml(copy.reason)}</div>` : ''}
            <div class="copy-actions">
                <button class="btn btn-small btn-secondary" onclick="editCopy(${index}, ${copyIndex})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteCopy(${index}, ${copyIndex})">Delete</button>
            </div>
        </div>
    `).join('');
    
    return `
        <div class="level-card-editor">
            <div class="level-header-editor">
                <div class="level-info">
                    <div class="level-name-editor">${escapeHtml(level.name)}</div>
                    <div class="level-meta">ID: ${escapeHtml(level.id.toString())}</div>
                    <div class="level-meta">Creator: ${escapeHtml(level.creator)}</div>
                    ${level.description ? `<div class="level-meta">${escapeHtml(level.description)}</div>` : ''}
                </div>
                <div class="level-actions">
                    <button class="btn btn-primary" onclick="editLevel(${index})">Edit Level</button>
                    <button class="btn btn-danger" onclick="deleteLevel(${index})">Delete Level</button>
                </div>
            </div>
            <div class="copies-section-editor">
                <div class="copies-header-editor">
                    <h3>Copies (${level.copies.length})</h3>
                    <div>
                        <span style="font-size: 0.85rem; color: #81c784; margin-right: 10px;">✓ ${approvedCount}</span>
                        <span style="font-size: 0.85rem; color: #ffb74d; margin-right: 10px;">⏳ ${pendingCount}</span>
                        <span style="font-size: 0.85rem; color: #e57373;">✗ ${rejectedCount}</span>
                    </div>
                </div>
                <div class="copies-grid">
                    ${copiesHtml}
                </div>
                <button class="btn btn-small btn-primary" onclick="addCopy(${index})" style="margin-top: 15px;">+ Add Copy</button>
            </div>
        </div>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text.toString();
    return div.innerHTML;
}

// Mark as having unsaved changes
function markUnsaved() {
    hasUnsavedChanges = true;
    updateDownloadButton();
}

// Update download button state
function updateDownloadButton() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (hasUnsavedChanges) {
        downloadBtn.textContent = 'Download JSON (Unsaved Changes)';
        downloadBtn.style.background = 'rgba(255, 152, 0, 0.8)';
    } else {
        downloadBtn.textContent = 'Download JSON';
        downloadBtn.style.background = 'rgba(76, 175, 80, 0.8)';
    }
}

// Add new level
function addLevel() {
    editingLevelIndex = null;
    temporaryCopies = []; // Reset temporary copies
    document.getElementById('modalTitle').textContent = 'Add New Level';
    document.getElementById('levelForm').reset();
    updateCopiesListDisplay();
    document.getElementById('levelModal').style.display = 'flex';
}

// Update copies list display in the level modal
function updateCopiesListDisplay() {
    const copiesList = document.getElementById('copiesList');
    const copiesToDisplay = editingLevelIndex === null ? temporaryCopies : levelsData[editingLevelIndex].copies;
    
    copiesList.innerHTML = copiesToDisplay.map((copy, copyIndex) => `
        <div class="copy-item-editor">
            <div class="copy-item-info">
                <div class="copy-item-name">${escapeHtml(copy.name)}</div>
                <div class="copy-item-meta">ID: ${escapeHtml(copy.id.toString())} | ${escapeHtml(copy.creator)} | ${copy.status}</div>
            </div>
            <div class="copy-item-actions">
                <button class="btn btn-small btn-secondary" onclick="editCopyFromModal(${copyIndex})">Edit</button>
                <button class="btn btn-small btn-danger" onclick="removeCopyFromModal(${copyIndex})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Edit existing level
function editLevel(index) {
    editingLevelIndex = index;
    temporaryCopies = []; // Clear temporary copies when editing existing level
    const level = levelsData[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Level';
    document.getElementById('levelId').value = level.id;
    document.getElementById('levelName').value = level.name;
    document.getElementById('levelCreator').value = level.creator;
    document.getElementById('levelDescription').value = level.description || '';
    
    // Display copies
    updateCopiesListDisplay();
    
    document.getElementById('levelModal').style.display = 'flex';
}

// Delete level
function deleteLevel(index) {
    if (confirm('Are you sure you want to delete this level? This action cannot be undone.')) {
        levelsData.splice(index, 1);
        markUnsaved();
        const searchInput = document.getElementById('searchInput');
        searchLevels(searchInput ? searchInput.value : '');
    }
}

// Add copy to level
function addCopy(levelIndex) {
    editingCopyParentIndex = levelIndex;
    editingCopyIndex = null;
    document.getElementById('copyModalTitle').textContent = 'Add New Copy';
    document.getElementById('copyForm').reset();
    document.getElementById('copyModal').style.display = 'flex';
}

// Edit copy
function editCopy(levelIndex, copyIndex) {
    editingCopyParentIndex = levelIndex;
    editingCopyIndex = copyIndex;
    const copy = levelsData[levelIndex].copies[copyIndex];
    
    document.getElementById('copyModalTitle').textContent = 'Edit Copy';
    document.getElementById('copyId').value = copy.id;
    document.getElementById('copyName').value = copy.name;
    document.getElementById('copyCreator').value = copy.creator;
    document.getElementById('copyStatus').value = copy.status;
    document.getElementById('copyReason').value = copy.reason || '';
    document.getElementById('copyModal').style.display = 'flex';
}

// Edit copy from modal
function editCopyFromModal(copyIndex) {
    if (editingLevelIndex === null) {
        // Editing temporary copy
        editingCopyParentIndex = null; // Use null to indicate temporary copy
        editingCopyIndex = copyIndex;
        const copy = temporaryCopies[copyIndex];
        
        document.getElementById('copyModalTitle').textContent = 'Edit Copy';
        document.getElementById('copyId').value = copy.id;
        document.getElementById('copyName').value = copy.name;
        document.getElementById('copyCreator').value = copy.creator;
        document.getElementById('copyStatus').value = copy.status;
        document.getElementById('copyReason').value = copy.reason || '';
        document.getElementById('levelModal').style.display = 'none';
        document.getElementById('copyModal').style.display = 'flex';
    } else {
        // Editing existing copy
        const level = levelsData[editingLevelIndex];
        editCopy(editingLevelIndex, copyIndex);
        document.getElementById('levelModal').style.display = 'none';
    }
}

// Remove copy from modal
function removeCopyFromModal(copyIndex) {
    if (confirm('Remove this copy from the level?')) {
        if (editingLevelIndex === null) {
            // Removing from temporary copies
            temporaryCopies.splice(copyIndex, 1);
            updateCopiesListDisplay();
        } else {
            // Removing from existing level
            levelsData[editingLevelIndex].copies.splice(copyIndex, 1);
            editLevel(editingLevelIndex); // Refresh the modal
            markUnsaved();
        }
    }
}

// Delete copy
function deleteCopy(levelIndex, copyIndex) {
    if (confirm('Are you sure you want to delete this copy?')) {
        levelsData[levelIndex].copies.splice(copyIndex, 1);
        markUnsaved();
        const searchInput = document.getElementById('searchInput');
        searchLevels(searchInput ? searchInput.value : '');
    }
}

// Save level form
document.getElementById('levelForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const levelData = {
        id: parseInt(document.getElementById('levelId').value),
        name: document.getElementById('levelName').value.trim(),
        creator: document.getElementById('levelCreator').value.trim(),
        description: document.getElementById('levelDescription').value.trim() || undefined,
        copies: editingLevelIndex === null ? temporaryCopies : (levelsData[editingLevelIndex]?.copies || [])
    };
    
    // Validate ID uniqueness
    if (editingLevelIndex === null) {
        if (levelsData.some(l => l.id === levelData.id)) {
            alert('A level with this ID already exists!');
            return;
        }
        levelsData.push(levelData);
    } else {
        // Check if ID changed and conflicts
        const oldId = levelsData[editingLevelIndex].id;
        if (levelData.id !== oldId && levelsData.some((l, i) => i !== editingLevelIndex && l.id === levelData.id)) {
            alert('A level with this ID already exists!');
            return;
        }
        levelsData[editingLevelIndex] = levelData;
    }
    
    // Sort by ID
    levelsData.sort((a, b) => a.id - b.id);
    
    // Clear temporary copies
    temporaryCopies = [];
    
    markUnsaved();
    // Refresh filtered levels and display
    const searchInput = document.getElementById('searchInput');
    searchLevels(searchInput ? searchInput.value : '');
    closeLevelModal();
});

// Save copy form
document.getElementById('copyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const copyData = {
        id: parseInt(document.getElementById('copyId').value),
        name: document.getElementById('copyName').value.trim(),
        creator: document.getElementById('copyCreator').value.trim(),
        status: document.getElementById('copyStatus').value,
        reason: document.getElementById('copyReason').value.trim() || undefined
    };
    
    if (editingCopyParentIndex === null) {
        // Adding/editing temporary copy (while creating new level)
        if (editingCopyIndex === null) {
            // Add new temporary copy
            temporaryCopies.push(copyData);
        } else {
            // Edit existing temporary copy
            temporaryCopies[editingCopyIndex] = copyData;
        }
        updateCopiesListDisplay();
    } else {
        // Adding/editing copy to existing level
        if (editingCopyIndex === null) {
            // Add new copy
            if (!levelsData[editingCopyParentIndex].copies) {
                levelsData[editingCopyParentIndex].copies = [];
            }
            levelsData[editingCopyParentIndex].copies.push(copyData);
        } else {
            // Edit existing copy
            levelsData[editingCopyParentIndex].copies[editingCopyIndex] = copyData;
        }
        markUnsaved();
    }
    
    // Refresh filtered levels and display
    const searchInput = document.getElementById('searchInput');
    searchLevels(searchInput ? searchInput.value : '');
    closeCopyModal();
    
    // If we were editing a level, reopen it
    if (editingLevelIndex !== null) {
        setTimeout(() => editLevel(editingLevelIndex), 100);
    } else {
        // If we were adding a new level, reopen the level modal
        document.getElementById('levelModal').style.display = 'flex';
    }
});

// Close modals
function closeLevelModal() {
    document.getElementById('levelModal').style.display = 'none';
    editingLevelIndex = null;
    temporaryCopies = []; // Clear temporary copies when closing modal
}

function closeCopyModal() {
    document.getElementById('copyModal').style.display = 'none';
    editingCopyIndex = null;
    const wasAddingNewLevel = editingCopyParentIndex === null && editingLevelIndex === null;
    editingCopyParentIndex = null;
    
    // If we were adding a new level, reopen the level modal
    if (wasAddingNewLevel) {
        document.getElementById('levelModal').style.display = 'flex';
    }
}

// Search functionality
function searchLevels(query) {
    if (!query || !query.trim()) {
        filteredLevels = [...levelsData];
    } else {
        const lowerQuery = query.toLowerCase();
        filteredLevels = levelsData.filter(level => {
            // Search in level name, creator, description, and copy creators
            const matchesLevel = (
                level.name.toLowerCase().includes(lowerQuery) ||
                level.creator.toLowerCase().includes(lowerQuery) ||
                level.id.toString().includes(lowerQuery) ||
                (level.description && level.description.toLowerCase().includes(lowerQuery))
            );
            
            // Also search in copies
            const matchesCopies = level.copies.some(copy => 
                copy.creator.toLowerCase().includes(lowerQuery) ||
                copy.id.toString().includes(lowerQuery) ||
                copy.status.toLowerCase().includes(lowerQuery) ||
                (copy.name && copy.name.toLowerCase().includes(lowerQuery)) ||
                (copy.reason && copy.reason.toLowerCase().includes(lowerQuery))
            );
            
            return matchesLevel || matchesCopies;
        });
    }
    
    currentPage = 1;
    displayLevels();
    updateResultsCount(filteredLevels.length);
    updatePagination();
}

// Update results count
function updateResultsCount(count) {
    const resultsInfo = document.getElementById('resultsCount');
    if (!resultsInfo) return;
    
    const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
    
    if (count === 0) {
        resultsInfo.textContent = '0';
        return;
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, count);
    
    if (totalPages > 1) {
        resultsInfo.innerHTML = `${startIndex}-${endIndex} of ${count}`;
    } else {
        resultsInfo.textContent = count;
    }
}

// Update pagination controls
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredLevels.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        pagination.classList.remove('visible');
        return;
    }
    
    pagination.style.display = 'flex';
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button class="page-btn" id="prevBtn" ${currentPage === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
    `;
    
    // Page numbers
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First page and ellipsis
    if (startPage > 1) {
        paginationHTML += `<button class="page-btn page-number" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }
    
    // Last page and ellipsis
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="page-btn page-number" data-page="${totalPages}">${totalPages}</button>`;
    }
    
    // Next button
    paginationHTML += `
        <button class="page-btn" id="nextBtn" ${currentPage === totalPages ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Add event listeners
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayLevels();
            updateResultsCount(filteredLevels.length);
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayLevels();
            updateResultsCount(filteredLevels.length);
            updatePagination();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    
    // Add event listeners to page number buttons
    document.querySelectorAll('.page-number').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page !== currentPage) {
                currentPage = page;
                displayLevels();
                updateResultsCount(filteredLevels.length);
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // Show pagination with animation
    setTimeout(() => {
        pagination.classList.add('visible');
    }, 10);
}

// Download JSON
function downloadJSON() {
    const dataStr = JSON.stringify(levelsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'levels.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    hasUnsavedChanges = false;
    updateDownloadButton();
    alert('JSON file downloaded successfully!');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Load data
    loadLevelsData();
    
    // Button event listeners
    document.getElementById('addLevelBtn').addEventListener('click', addLevel);
    document.getElementById('downloadBtn').addEventListener('click', downloadJSON);
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeLevelModal);
    document.getElementById('closeCopyModal').addEventListener('click', closeCopyModal);
    document.getElementById('cancelBtn').addEventListener('click', closeLevelModal);
    document.getElementById('cancelCopyBtn').addEventListener('click', closeCopyModal);
    
    // Close modals on background click
    document.getElementById('levelModal').addEventListener('click', (e) => {
        if (e.target.id === 'levelModal') closeLevelModal();
    });
    document.getElementById('copyModal').addEventListener('click', (e) => {
        if (e.target.id === 'copyModal') closeCopyModal();
    });
    
    // Add copy button in level modal
    document.getElementById('addCopyBtn').addEventListener('click', () => {
        editingCopyParentIndex = editingLevelIndex; // null if adding new level, index if editing
        editingCopyIndex = null;
        document.getElementById('copyModalTitle').textContent = 'Add New Copy';
        document.getElementById('copyForm').reset();
        document.getElementById('levelModal').style.display = 'none';
        document.getElementById('copyModal').style.display = 'flex';
    });
    
    // Warn before leaving if there are unsaved changes
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
    
    // Initial download button state
    updateDownloadButton();
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearButton');
    
    if (searchInput && clearButton) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value;
            searchLevels(query);
            
            // Show/hide clear button
            if (query.trim()) {
                clearButton.style.display = 'block';
            } else {
                clearButton.style.display = 'none';
            }
        });
        
        // Clear search
        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            clearButton.style.display = 'none';
            searchLevels('');
        });
        
        // Allow Escape key to clear search
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                clearButton.style.display = 'none';
                searchLevels('');
            }
        });
    }
});

