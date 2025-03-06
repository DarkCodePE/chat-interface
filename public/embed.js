/**
 * Revisión Técnica Chat Widget - Embed Script
 *
 * Use this script to embed the chat widget on any website.
 * Place this script at the end of your HTML body.
 *
 * Usage:
 *   <script
 *     src="https://chat-interface-nine.vercel.app/embed.js"
 *     data-chat-api="https://your-backend-api-url.com/chat"
 *     data-client-id="YOUR_CLIENT_ID"
 *   ></script>
 */

(function() {
    // Configuration options
    const config = {
        iframeUrl: 'https://chat-interface-nine.vercel.app/embed',
        apiUrl: null,
        clientId: null,
        defaultPosition: 'bottom-right',
        width: '400px',
        height: '600px',
        zIndex: 9999,
        autoOpen: false,
        mobileBreakpoint: 768
    };

    // Parse script attributes
    const scriptTag = document.currentScript || (function() {
        const scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    })();

    if (scriptTag) {
        config.apiUrl = scriptTag.getAttribute('data-chat-api') || config.apiUrl;
        config.clientId = scriptTag.getAttribute('data-client-id') || config.clientId;
        config.position = scriptTag.getAttribute('data-position') || config.defaultPosition;
        config.width = scriptTag.getAttribute('data-width') || config.width;
        config.height = scriptTag.getAttribute('data-height') || config.height;
        config.zIndex = scriptTag.getAttribute('data-z-index') || config.zIndex;
        config.autoOpen = scriptTag.getAttribute('data-auto-open') === 'true' || config.autoOpen;
    }

    // Create and inject CSS
    const style = document.createElement('style');
    style.textContent = `
    .rt-chat-widget-container {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: ${config.zIndex};
      width: ${config.width};
      height: ${config.height};
      max-height: calc(100vh - 40px);
      border: none;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      opacity: 1;
      transition: all 0.3s ease;
      transform: translateY(0);
    }
    
    .rt-chat-widget-container.rt-chat-collapsed {
      height: 60px;
      width: 60px;
    }
    
    .rt-chat-toggle {
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: calc(${config.zIndex} + 1);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #4f46e5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .rt-chat-toggle:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
    }
    
    .rt-chat-toggle svg {
      width: 30px;
      height: 30px;
    }
    
    @media (max-width: ${config.mobileBreakpoint}px) {
      .rt-chat-widget-container {
        width: calc(100% - 40px);
        max-width: ${config.width};
      }
    }
  `;
    document.head.appendChild(style);

    // Create elements
    const container = document.createElement('div');
    container.className = 'rt-chat-widget-container rt-chat-collapsed';

    const iframe = document.createElement('iframe');
    iframe.src = `${config.iframeUrl}?clientId=${encodeURIComponent(config.clientId || '')}&api=${encodeURIComponent(config.apiUrl || '')}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.id = 'rt-chat-iframe';
    container.appendChild(iframe);

    const toggleButton = document.createElement('div');
    toggleButton.className = 'rt-chat-toggle';
    toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  `;

    // Track widget state
    let isExpanded = false;

    // Toggle chat widget
    const toggleChat = () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
            // Expand the chat
            container.classList.remove('rt-chat-collapsed');
            toggleButton.style.display = 'none';

            // Show iframe content
            const iframeEl = document.getElementById('rt-chat-iframe');
            if (iframeEl) {
                iframeEl.style.display = 'block';

                // Notify iframe if needed
                if (iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'CHAT_EXPANDED'
                    }, '*');
                }
            }
        } else {
            // Collapse the chat
            container.classList.add('rt-chat-collapsed');
            toggleButton.style.display = 'flex';

            // We can either hide the iframe or keep it loaded but collapsed
            const iframeEl = document.getElementById('rt-chat-iframe');
            if (iframeEl) {
                // Option 1: Hide it completely
                // iframeEl.style.display = 'none';

                // Option 2: Keep it loaded but notify the iframe
                if (iframeEl.contentWindow) {
                    iframeEl.contentWindow.postMessage({
                        type: 'CHAT_COLLAPSED'
                    }, '*');
                }
            }
        }
    };

    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        // Validate origin for security (uncomment and modify when in production)
        // if (event.origin !== 'https://chat-interface-nine.vercel.app') return;

        const { type, data } = event.data;

        switch (type) {
            case 'CHAT_CLOSE':
                if (isExpanded) toggleChat();
                break;
            case 'NEW_MESSAGE':
                // You can trigger notifications here if needed
                break;
        }
    });

    // Add click handler to toggle button
    toggleButton.addEventListener('click', toggleChat);

    // Auto open the chat if configured
    if (config.autoOpen) {
        setTimeout(() => {
            toggleChat();
        }, 1000);
    }

    // Add elements to DOM
    document.body.appendChild(container);
    document.body.appendChild(toggleButton);

    // Expose the API for programmatic control
    window.RTChatWidget = {
        open: () => {
            if (!isExpanded) toggleChat();
        },
        close: () => {
            if (isExpanded) toggleChat();
        },
        toggle: toggleChat,
        sendMessage: (message) => {
            const iframeEl = document.getElementById('rt-chat-iframe');
            if (iframeEl && iframeEl.contentWindow) {
                iframeEl.contentWindow.postMessage({
                    type: 'SEND_MESSAGE',
                    data: { message }
                }, '*');
            }
        }
    };
})();