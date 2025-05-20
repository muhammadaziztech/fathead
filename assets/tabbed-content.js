class TabbedContent extends HTMLElement {
	constructor() {
		super();
        this.index = 0;
        this.tabs_links = this.querySelectorAll('.tabs__list a');
        this.tabs_panels = this.querySelectorAll('.tab-panel');

        this.tabs_links.forEach( (tab, curr_index) => {
            tab.addEventListener('keydown', ev => {
                const LEFT_ARROW = 37;
                const UP_ARROW = 38;
                const RIGHT_ARROW = 39;
                const DOWN_ARROW = 40;
                const k = ev.which || ev.keyCode;

                if (k >= LEFT_ARROW && k <= DOWN_ARROW) {
                    if (k == LEFT_ARROW || k == UP_ARROW) {
                        if (this.index > 0) {
                            this.index--;
                        }
                        else {
                            this.index = this.tabs_links.length - 1;
                        }
                    }
                    else if (k == RIGHT_ARROW || k == DOWN_ARROW) {
                        if (this.index < this.tabs_links.length - 1) {
                            this.index++;
                        }
                        else {
                            this.index = 0;
                        }
                    }
                    this.tabs_links[this.index].click();
                    ev.preventDefault();
                }
            });
            tab.addEventListener('click', ev => {
                this.index = curr_index;
                this.setFocus();
                ev.preventDefault();
            })
        })
	}
    setFocus(){
        this.tabs_links.forEach( tab => {
            tab.setAttribute('tabindex', '-1');
            tab.setAttribute('aria-selected', 'false');
            tab.classList.remove('current');
        });
        this.tabs_panels.forEach( tab => {
            tab.classList.remove('current');
        });

        this.tabs_links[this.index].setAttribute('tabindex', '0');
        this.tabs_links[this.index].setAttribute('aria-selected', 'true');
        this.tabs_links[this.index].classList.add('current');
        this.tabs_links[this.index].focus();
        
        this.querySelector( this.tabs_links[this.index].getAttribute('href') ).classList.add('current');

    }
}

customElements.define("tabbed-content", TabbedContent);
