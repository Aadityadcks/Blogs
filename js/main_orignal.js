document.addEventListener('DOMContentLoaded', () => {
  // --- Existing Logic ---
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = '';
        navLinks.style.flexDirection = '';
        navLinks.style.position = '';
        navLinks.style.top = '';
        navLinks.style.left = '';
        navLinks.style.right = '';
        navLinks.style.background = '';
        navLinks.style.padding = '';
        navLinks.style.borderBottom = '';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '80px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = 'rgba(0,0,0,0.95)';
        navLinks.style.padding = '2rem';
        navLinks.style.borderBottom = '1px solid var(--border-color)';
      }
    });
  }

  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.nav-link');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '/' && href === 'index.html')) {
      link.classList.add('active');
    } else if (currentPath.endsWith(href) && href !== 'index.html') {
      link.classList.add('active');
    }
  });

  const timeDisplay = document.getElementById('terminal-time');
  if (timeDisplay) {
    const updateClock = () => {
      const now = new Date();
      timeDisplay.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' SYS';
    };
    updateClock(); 
    setInterval(updateClock, 1000);
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if(href === '#') return;

      e.preventDefault();
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        const headerOffset = 140; 
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
        window.scrollTo({
           top: offsetPosition,
           behavior: "smooth"
        });
      }
    });
  });

  // --- Dynamic Content Engine ---

  async function fetchContent() {
    try {
      const response = await fetch('content/data.json');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      generateAutoNav(data);
      populateGrids(data);
      populateViewer(data);
      
    } catch (error) {
      console.error('Failed to fetch dynamic content:', error);
    }
  }

  function generateAutoNav(data) {
    // Attach dropdown menus to existing nav items based on text content
    const navItems = document.querySelectorAll('.nav-links > li');
    
    navItems.forEach(item => {
      const link = item.querySelector('a');
      if (!link) return;
      
      let itemsToAdd = [];
      if (link.textContent.includes('The Lab')) {
        itemsToAdd = data.labs || [];
      } else if (link.textContent.includes('The Archive')) {
        itemsToAdd = data.blogs || [];
      } else if (link.textContent.includes('Services')) {
        itemsToAdd = data.services || [];
      }

      if (itemsToAdd.length > 0) {
        item.classList.add('nav-item-dropdown');
        const ul = document.createElement('ul');
        ul.className = 'dropdown-menu';
        
        itemsToAdd.forEach(entry => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = `viewer.html?id=${entry.id}`;
          a.target = '_blank';
          a.textContent = `> ${entry.title}`;
          li.appendChild(a);
          ul.appendChild(li);
        });
        
        item.appendChild(ul);
      }
    });
  }

  function createCardHTML(entry) {
    let imgHTML = '';
    if (entry.imageLink) {
      imgHTML = `
        <div class="card-img-container">
          <img src="${entry.imageLink}" alt="${entry.title}" loading="lazy">
        </div>
      `;
    }
    
    return `
      <div class="card">
        ${imgHTML}
        <span class="card-tag">#${entry.category}</span>
        <h4 class="card-title">${entry.title}</h4>
        <p>${entry.description}</p>
        <a href="viewer.html?id=${entry.id}" target="_blank" class="btn" style="padding: 0.5rem 1rem; font-size: 0.8rem;">[ Read More ]</a>
      </div>
    `;
  }

  function populateGrids(data) {
    // Use target classes or specific IDs for different categories if needed
    // In our HTML, we'll set specific IDs like grid-blogs, grid-labs
    
    // Blogs
    const aiGrid = document.getElementById('grid-blogs-ai');
    const pentestGrid = document.getElementById('grid-blogs-pentesting');
    const workflowGrid = document.getElementById('grid-blogs-workflows');
    
    if (data.blogs) {
        if (aiGrid) aiGrid.innerHTML = data.blogs.filter(b => b.category === 'AI-Automation').map(createCardHTML).join('');
        if (pentestGrid) pentestGrid.innerHTML = data.blogs.filter(b => b.category === 'Pentesting').map(createCardHTML).join('');
        if (workflowGrid) workflowGrid.innerHTML = data.blogs.filter(b => b.category === 'Workflows').map(createCardHTML).join('');
    }

    // Labs
    const labAiGrid = document.getElementById('grid-labs-ai');
    const labPentestGrid = document.getElementById('grid-labs-pentesting');
    const labWorkflowGrid = document.getElementById('grid-labs-workflows');

    if (data.labs) {
        if (labAiGrid) labAiGrid.innerHTML = data.labs.filter(l => l.category === 'AI-Automation').map(createCardHTML).join('');
        if (labPentestGrid) labPentestGrid.innerHTML = data.labs.filter(l => l.category === 'Pentesting').map(createCardHTML).join('');
        if (labWorkflowGrid) labWorkflowGrid.innerHTML = data.labs.filter(l => l.category === 'Workflows').map(createCardHTML).join('');
    }

    // Services
    const servicesGrid = document.getElementById('grid-services');
    if (servicesGrid && data.services) {
      servicesGrid.innerHTML = data.services.map(createCardHTML).join('');
    }
  }

  function populateViewer(data) {
    const viewerContainer = document.getElementById('viewer-content');
    if (!viewerContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (!id) {
      viewerContainer.innerHTML = '<h2 class="fade-in-up">Error: No ID provided.</h2>';
      return;
    }

    const allEntries = [...(data.blogs || []), ...(data.labs || []), ...(data.services || [])];
    const foundEntry = allEntries.find(entry => entry.id === id);

    if (foundEntry) {
      let imgHTML = '';
      if (foundEntry.imageLink) {
        imgHTML = `
          <div class="card-img-container fade-in-up delay-1" style="height: 400px; margin-top: 2rem; margin-bottom: 3rem; width: 100%; margin-left: 0;">
            <img src="${foundEntry.imageLink}" alt="${foundEntry.title}">
          </div>
        `;
      }

      viewerContainer.innerHTML = `
        <span class="hero-subtitle fade-in-up">[ ${foundEntry.category.toUpperCase()} ]</span>
        <h1 class="fade-in-up delay-1" style="font-size: clamp(2.5rem, 6vw, 4.5rem); margin-bottom: 2rem;">
          ${foundEntry.title}<span class="accent">.</span>
        </h1>
        ${imgHTML}
        <div class="fade-in-up ${foundEntry.imageLink ? 'delay-2' : 'delay-1'}" style="font-size: 1.1rem; max-width: 800px; line-height: 1.8;">
          <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 2rem;">${foundEntry.description}</p>
          <div style="color: var(--text-secondary);">
            ${foundEntry.content.replace(/\n/g, '<br><br>')}
          </div>
        </div>
      `;
    } else {
      viewerContainer.innerHTML = '<h2 class="fade-in-up">Error: Entry not found.</h2>';
    }
  }

  fetchContent();
});
