import Component from '../../../helpers/component';

export default class Article extends Component {
    prepare() {
        this.headlines = this.content.querySelectorAll('h1, h2, h3, h4, h5, h6');
        this.elements = this.content.children;
    }

    init() {
        this.assignSections();
        this.observeElements();
    }

    assignSections() {
        let headlineIndex = 0;
        Array.from(this.elements).forEach((el) => {
            if (Array.from(this.headlines).indexOf(el) >= 0) {
                headlineIndex ++;
            }
            el.dataset.articleSectionIndex = headlineIndex;
        })
    }

    observeElements() {
        const callback = (entries) => {
            Object.keys(entries).forEach((index) => {

                if (entries[index].isIntersecting) {
                    const thisSectionIndex = entries[index].target.dataset.articleSectionIndex;
                    const assignedHeadline = Array.from(this.headlines).filter((headline) => 
                        headline.dataset.articleSectionIndex === thisSectionIndex)[0];
                    
                    this.sendEvent({
                        headline: assignedHeadline,
                    })
                }
            });
        };

        const observer = new IntersectionObserver(callback, {
            threshold: [1],
        });

        Object.keys(this.elements).forEach((index) => {
            observer.observe(this.elements[index]);
        });
    }

    sendEvent(payload) {
        if (!payload || !payload.headline) {
            return;
        }

        EventBus.publish('onHeadlineInScreen', {
            el: payload.headline,
        });
    }
}