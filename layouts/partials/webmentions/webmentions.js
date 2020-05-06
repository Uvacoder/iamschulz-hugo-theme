import Component from '../../../helpers/component';

/**
 * todo:
 *      - fix author URLs
 *      - fix dev comment order
 *      - display likes
 *      - add comment origin link
 *      - rename component
 */

export default class Webmentions extends Component {
    prepare() {
        this.apiProxyUrl = this.el.dataset.webmentionsApiProxy;
        this.webmentionsUrl = this.el.dataset.webmentionsUrl;
        this.devId = this.el.dataset.webmentionsDevId;
        this.targetUrl = window.location.href.replace("http://localhost:1313", "https://next.iamschulz.de");
    }

    init() {
        if (!this.apiProxyUrl) { return; }
        this.replies = [];
        this.likes = 0;
        this.fetches = [];

        if (this.devId) { this.fetches.push(this.getDevLikes()); }
        if (this.devId) { this.fetches.push(this.getDevComments()); }
        if (this.webmentionsUrl) { this.fetches.push(this.getWebmentions()); }

        if (this.fetches.length < 1) {
            this.showReplies();
        } else {
            Promise.all(this.fetches).then(() => {
                this.showReplies();
            });
        }
    }

    getDevLikes() {
        const devFetchUrl = `https://dev.to/api/articles/${this.devId}`;
        const apiFetchUrl = `${this.apiProxyUrl}${encodeURIComponent(devFetchUrl)}&time=${Date.now()}`;

        return fetch(apiFetchUrl)
            .then(response => response.json())
            .then((data) => {
                this.likes += data.positive_reactions_count;
            });
    }

    getDevComments() {
        const devFetchUrl = `https://dev.to/api/comments?a_id=${this.devId}`;
        const apiFetchUrl = `${this.apiProxyUrl}${encodeURIComponent(devFetchUrl)}&time=${Date.now()}`;

        return fetch(apiFetchUrl)
            .then(response => response.json())
            .then((data) => {
                Array.from(data).forEach(reply => this.addDevReply(reply));
            });
    }

    getWebmentions() {
        const webmentionsFetchUrl = `https://webmention.io/api/mentions.jf2?domain=${this.webmentionsUrl}&target=${this.targetUrl}`;
        const apiFetchUrl = `${this.apiProxyUrl}${encodeURIComponent(webmentionsFetchUrl)}&time=${Date.now()}`;

        return fetch(apiFetchUrl)
            .then(response => response.json())
            .then((data) => {
                Array.from(data.children).forEach(reply => this.addWebmentionReply(reply));
            });
    }

    addDevReply(replyData) {
        if (!replyData.user || !replyData.user.name || !replyData.body_html ) { return; }

        let reply = this.cloneReplyElement();

        reply.name.innerHTML = replyData.user.name;
        if (replyData.user.website_url) { reply.link.href = replyData.user.website_url; }
        reply.avatar.src = replyData.user.profile_image_90 || "";

        // dev api beta doesn't send publish dates for comments
        const publishDate = replyData.published || -1;
        reply.date.innerHTML = publishDate
            ? new Date(publishDate).toISOString().slice(0,10).split("-").reverse().join(".")
            : "some time";
        reply.date.setAttribute('hidden', 'hidden');

        reply.content.innerHTML = replyData.body_html.split('<body>')[1].split('</body>')[0];

        reply.el.content.firstChild.removeAttribute('hidden');

        const timestamp = new Date(publishDate).getTime() + Math.random();
        this.replies.push([timestamp, reply.el.content.firstChild.outerHTML]);
    }

    addWebmentionReply(replyData) {
        if (!replyData.author || !replyData.author.name ) { return; }

        if (!!replyData && replyData['like-of'] === this.targetUrl) {
            this.likes =+ 1;
            return;
        }

        let reply = this.cloneReplyElement();

        reply.name.innerHTML = replyData.author.name;
        if (replyData.author.url) { reply.link.href = replyData.author.url; }
        reply.avatar.src = replyData.author.photo || "";

        const publishDate = replyData.published || replyData['wm-received'];
        reply.date.innerHTML = publishDate
            ? new Date(publishDate).toISOString().slice(0,10).split("-").reverse().join(".")
            : "some time";
        
        if (!!replyData.content && replyData.content.html) {
            reply.content.innerHTML = replyData.content.html;
        }

        reply.el.content.firstChild.removeAttribute('hidden');

        let timestamp = publishDate ? new Date(publishDate).getTime() : 0;
        timestamp = timestamp + Math.random();
        this.replies.push([timestamp, reply.el.content.firstChild.outerHTML]);
    }

    cloneReplyElement() {
        let el = document.createElement('template');
        el.innerHTML = this.prototype.outerHTML;
        let link = el.content.firstChild.querySelector('[data-webmentions-el="link"]');
        let avatar = el.content.firstChild.querySelector('[data-webmentions-el="avatar"]');
        let name = el.content.firstChild.querySelector('[data-webmentions-el="name"]');
        let date = el.content.firstChild.querySelector('[data-webmentions-el="date"]');
        let content = el.content.firstChild.querySelector('[data-webmentions-el="content"]');

        return {
            el: el,
            link: link,
            avatar: avatar,
            name: name,
            date: date,
            content: content
        };
    }

    showReplies() {
        this.loader.classList.add('is--hidden');
        if (this.replies.length < 1) { return; }


        this.replies.sort(function(a, b) {
            return a[0] - b[0];
        });

        let replyListHTML = '';
        this.replies.forEach(reply => {
            replyListHTML += reply[1];
        })

        this.title.removeAttribute('hidden');
        this.replyList.insertAdjacentHTML('beforeend', replyListHTML);
    }
}
