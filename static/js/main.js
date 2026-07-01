document.addEventListener('DOMContentLoaded', () => {
    // App State
    let releaseData = null;
    let selectedUpdate = null;
    let activeFilter = 'all';
    let searchQuery = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const feedContainer = document.getElementById('feed-container');
    const feedStatusText = document.getElementById('feed-status-text');
    const warningBanner = document.getElementById('warning-banner');
    const warningText = document.getElementById('warning-text');
    
    // Tweet Composer Elements
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const tweetBtn = document.getElementById('tweet-btn');
    const composerBox = document.getElementById('composer-box');
    const birdIcon = document.getElementById('bird-icon');
    const defaultPlaceholderText = "Select any BigQuery update card to load its details and compose a tweet about it here.";

    // Init Page
    fetchReleases();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleases);
    searchInput.addEventListener('input', handleSearch);
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            renderFeed();
        });
    });

    tweetTextarea.addEventListener('input', updateCharCount);
    tweetBtn.addEventListener('click', executeTweet);

    // Functions
    async function fetchReleases() {
        setLoadingState(true);
        hideWarning();
        
        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            releaseData = data;
            
            if (data.warning) {
                showWarning(data.warning);
            }
            
            // Format Last Updated date
            if (data.last_updated) {
                const date = new Date(data.last_updated);
                feedStatusText.innerHTML = `Feed updated: <span>${date.toLocaleDateString()}</span>`;
            }
            
            // Update filter counts
            updateFilterBadges();
            
            // Render feed
            renderFeed();
            
            // Auto-select first update if available
            selectFirstUpdate();
            
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showWarning(`Failed to load release notes: ${error.message}`);
            showEmptyState('Error Loading Feed', 'Please check your internet connection and try again.');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshBtn.classList.add('spinning');
            feedContainer.innerHTML = `
                <div class="loader-container">
                    <div class="main-spinner"></div>
                    <p>Fetching BigQuery release notes...</p>
                </div>
            `;
            tweetBtn.disabled = true;
        } else {
            refreshBtn.classList.remove('spinning');
        }
    }

    function showWarning(message) {
        warningText.textContent = message;
        warningBanner.style.display = 'flex';
    }

    function hideWarning() {
        warningBanner.style.display = 'none';
    }

    function updateFilterBadges() {
        if (!releaseData || !releaseData.entries) return;

        // Calculate counts
        let counts = {
            all: 0,
            feature: 0,
            change: 0,
            announcement: 0,
            breaking: 0,
            issue: 0
        };

        releaseData.entries.forEach(entry => {
            entry.updates.forEach(update => {
                counts.all++;
                const type = update.type.toLowerCase();
                if (counts.hasOwnProperty(type)) {
                    counts[type]++;
                }
            });
        });

        // Update counts in DOM
        filterButtons.forEach(btn => {
            const filter = btn.dataset.filter;
            const badge = btn.querySelector('.badge-count');
            if (badge && counts.hasOwnProperty(filter)) {
                badge.textContent = counts[filter];
            }
        });
    }

    function handleSearch(e) {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    }

    function renderFeed() {
        if (!releaseData || !releaseData.entries) return;

        feedContainer.innerHTML = '';
        let matchedCount = 0;

        releaseData.entries.forEach(entry => {
            // Filter updates within the entry
            const filteredUpdates = entry.updates.filter(update => {
                const matchesType = (activeFilter === 'all' || update.type.toLowerCase() === activeFilter);
                const matchesSearch = (
                    update.clean_text.toLowerCase().includes(searchQuery) ||
                    update.type.toLowerCase().includes(searchQuery) ||
                    entry.date.toLowerCase().includes(searchQuery)
                );
                return matchesType && matchesSearch;
            });

            if (filteredUpdates.length > 0) {
                matchedCount += filteredUpdates.length;

                // Create date group
                const dateGroup = document.createElement('div');
                dateGroup.className = 'date-group';

                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `
                    <div class="date-title">${entry.date}</div>
                    <div class="date-line"></div>
                `;
                dateGroup.appendChild(dateHeader);

                // Add cards for each update
                filteredUpdates.forEach(update => {
                    const card = document.createElement('div');
                    card.className = `update-card ${selectedUpdate && selectedUpdate.id === update.id ? 'selected' : ''}`;
                    card.dataset.id = update.id;
                    
                    const isFeature = update.type.toLowerCase() === 'feature';
                    const isChange = update.type.toLowerCase() === 'change';
                    const isAnnounce = update.type.toLowerCase() === 'announcement';
                    const isBreaking = update.type.toLowerCase() === 'breaking';
                    const isIssue = update.type.toLowerCase() === 'issue';

                    let badgeClass = 'general';
                    if (isFeature) badgeClass = 'feature';
                    else if (isChange) badgeClass = 'change';
                    else if (isAnnounce) badgeClass = 'announcement';
                    else if (isBreaking) badgeClass = 'breaking';
                    else if (isIssue) badgeClass = 'issue';

                    card.innerHTML = `
                        <div class="card-header">
                            <span class="type-badge ${badgeClass}">${update.type}</span>
                            <div class="card-meta">
                                <span class="card-date">${entry.date}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            ${update.content}
                        </div>
                        <div class="card-actions">
                            <button class="btn-text">
                                <svg viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.7 0-1.37-.2-1.95-.54v.05c0 2.08 1.48 3.82 3.44 4.21-.36.1-.74.15-1.13.15-.27 0-.54-.03-.8-.08.54 1.7 2.13 2.93 4.01 2.97-1.47 1.15-3.32 1.84-5.32 1.84-.35 0-.69-.02-1.03-.06 1.9 1.22 4.16 1.93 6.59 1.93 7.9 0 12.22-6.54 12.22-12.22 0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/></svg>
                                Compose Tweet
                            </button>
                        </div>
                    `;

                    // Handle card click
                    card.addEventListener('click', () => {
                        selectUpdate(update);
                        
                        // Highlight card in list
                        document.querySelectorAll('.update-card').forEach(c => c.classList.remove('selected'));
                        card.classList.add('selected');
                    });

                    dateGroup.appendChild(card);
                });

                feedContainer.appendChild(dateGroup);
            }
        });

        if (matchedCount === 0) {
            showEmptyState('No Release Notes Found', 'Try adjusting your search terms or selecting a different filter.');
        }
    }

    function showEmptyState(title, description) {
        feedContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm3-6H4V5h16v2z"/>
                </svg>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }

    function selectFirstUpdate() {
        if (!releaseData || !releaseData.entries || releaseData.entries.length === 0) return;
        
        // Find first update in the feed that matches current filters
        for (let entry of releaseData.entries) {
            const matches = entry.updates.filter(update => {
                return activeFilter === 'all' || update.type.toLowerCase() === activeFilter;
            });
            if (matches.length > 0) {
                selectUpdate(matches[0]);
                break;
            }
        }
    }

    function selectUpdate(update) {
        selectedUpdate = update;
        tweetTextarea.value = update.tweet_text;
        tweetTextarea.placeholder = "";
        composerBox.classList.add('active');
        updateCharCount();
    }

    function updateCharCount() {
        const length = tweetTextarea.value.length;
        charCounter.textContent = `${length}/280`;

        if (length === 0 || tweetTextarea.value === defaultPlaceholderText) {
            tweetBtn.disabled = true;
            charCounter.className = 'tweet-char-counter';
        } else if (length > 280) {
            tweetBtn.disabled = true;
            charCounter.className = 'tweet-char-counter danger';
        } else if (length > 250) {
            tweetBtn.disabled = false;
            charCounter.className = 'tweet-char-counter warning';
        } else {
            tweetBtn.disabled = false;
            charCounter.className = 'tweet-char-counter';
        }
    }

    function executeTweet() {
        const text = tweetTextarea.value.trim();
        if (!text || text === defaultPlaceholderText) return;

        // Animate bird flying away!
        birdIcon.classList.add('fly-effect');
        tweetBtn.disabled = true;
        tweetBtn.style.opacity = '0.8';
        tweetBtn.querySelector('span').textContent = 'Launching...';

        setTimeout(() => {
            // Reset button animation
            birdIcon.classList.remove('fly-effect');
            tweetBtn.querySelector('span').textContent = 'Tweet on X';
            updateCharCount();
            tweetBtn.style.opacity = '1';

            // Open Twitter Web Intent in a new tab
            const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }, 800);
    }
});
