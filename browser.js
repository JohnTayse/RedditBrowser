var browser = (function(){
	'use strict';

	var host = 'https://www.reddit.com';

	var methods = {};

	methods.getUrl = function(id, sort, guid){
		$.mobile.loading('show');
		var reddit = '';
		if(id.indexOf('user/') > -1){
			reddit = id
		}
		else
		{
			reddit = 'r/' + id
		}
	
		var baseUrl = host + '/' + reddit + '/';
		var simpleSorts = ['hot', 'new', 'submitted'];
		var params = {
			limit: 25,
			include_over_18: true,
		}
		var options = {};

		if(sort === undefined){
			baseUrl += '.json';
		}
		else if(simpleSorts.includes(sort)){
			baseUrl += sort + '/.json'
		}
		else{
			baseUrl += 'top/.json';
			options['t'] = sort;
		}
	
		if(guid !== undefined){
			options['after'] = guid;
		}

		baseUrl = baseUrl + '?' + new URLSearchParams(Object.assign(params, options))
	
		return baseUrl;
	}

	methods.getSubmissions = async function(url) {
		return await fetch(url)
			.then(res => res.json())
			.then(json => json.data)
			.then(data => ({
				after: data.after,
				posts: data.children
			}))
			.catch(err => {
				$.mobile.loading('hide');
				alert("This page does not exist or was deleted.")
				window.location = '';
			});
	}

	methods.displayList = function(id, sort, posts, after){
		$('#audioMutedButton').show();

		$('#subredditButton').remove();

		var browseList = '<section id="browseList" class="ui-grid-c">';
		browseList = '<span id="top"></span>';
		var isFavorite = browser.isFavorite(id);
		if(isFavorite !== undefined){
			browseList += '<button id="favoriteButton" onclick="browser.removeFavorite(\'' + id + '\')" class="ui-btn ui-corner-all ui-btn-inline">' + id + ' &#9733</button>';
		}
		else {
			browseList += '<button id="favoriteButton" onclick="browser.addFavorite(\'' + id + '\')" class="ui-btn ui-corner-all ui-btn-inline">' + id + ' &#9734</button>';
		}

		//sort
		browseList += '<select name="sortSelect" id="sortSelect" data-mini="true" data-inline="true">';
		browseList += '<option value="hot">Hot</option>';
		browseList += '<option value="new">New</option>';
		if(id.indexOf('user/') > -1){
			browseList += '<option value="submitted">Submitted</option>';
		}
		browseList += '<option value="hour">Top Now</option>';
		browseList += '<option value="day">Top Today</option>';
		browseList += '<option value="week">Top This Week</option>';
		browseList += '<option value="month">Top This Month</option>';
		browseList += '<option value="year">Top This Year</option>';
		browseList += '<option value="all">Top All Time</option>';
		browseList += '</select>';
		browseList += '<button id="navend" onclick="document.getElementById(\'end\').scrollIntoView()" class="ui-btn ui-corner-all ui-btn-inline">End</button>';
		browseList += '<br/>';

		posts.forEach(post => {
			if(post.data.preview != undefined || post.data.gallery_data != undefined){
				browseList += '<a id="' + post.data.name + '" class="item ui-bar ui-bar-a">';
				browseList += '<p class="title clamp">' + post.data.title + '</p>';
				browseList += '<img src="' + post.data.thumbnail + '"/>';
				browseList += '</a>';
			}
			else{
				browseList += '<a id="' + post.data.name + '" class="item ui-bar ui-bar-a">';
				browseList += '<p class="title clamp">' + post.data.title + '</p>';
				browseList += '</a>';
			}
		})

		browseList += '<br/><a href="#" id="nextButton" class="ui-btn ui-corner-all ui-btn-inline">Next</a>';
		browseList += '<span id="end"></span>';
		browseList += '<button id="navtop" onclick="document.getElementById(\'top\').scrollIntoView()" class="ui-btn ui-corner-all ui-btn-inline">Top</button>';
		browseList += '</section>'
		$('#app').html(browseList).trigger('create');

		$.mobile.loading('hide');

		if(sort !== undefined){
			var el = $('#sortSelect');
			el.val(sort).attr('selected', true).siblings('option').removeAttr('selected');
			el.selectmenu("refresh", true);
		}

		$('#sortSelect').on('change', function(){
			var sortSelected = $('#sortSelect').val();
			var url = browser.getUrl(id, sortSelected);
			browser.getSubmissions(url)
				.then((data) => {
					browser.displayList(id, sortSelected, data.posts, data.after);
				})
		})

		$('#nextButton').click(function(){
			var url = browser.getUrl(id, sort, after);
			browser.getSubmissions(url)
				.then((data) => {
					var concatenated = posts.concat(data.posts);
					var last = concatenated[concatenated.length - 1].data.name
					browser.displayList(id, sort, concatenated, last);
				})
		})
		
		$('.item').click(function(){
			browser.displayItem(id, sort, posts, this.id, after);
		})
	}

	methods.displayItem = function(id, sort, list, selected, after){
		$('#audioMutedButton').hide();

		var index = -1;
		var item = list.find(function(ele, i){
			index = i;
			return ele.data.name == selected;
		}).data;

		$('#subredditButton').remove();
		$('#header').append('<a href="#" id="subredditButton" class="ui-btn ui-corner-all ui-btn-inline">' + id + '</a>').trigger('create');
	
		var postAge = browser.getAge(item.created);
	
		var browseItem = '';
		
		browseItem += '<p class="title"><span id="itemTitle">' + item.title + '</span><br/>';
		browseItem += '<a href="' + host + item.permalink + '" style="float:left" target="_blank">(source)</a>';
		if(id.indexOf('user/') === -1 && item.author !== null){
			var user = item.author;
			browseItem += '<a href="#/user/' + user + '" target="_blank">(' + user + ')</a>';
			var usr = 'user/' + user;
			if(browser.isFavorite(usr)){
				browseItem += '&#9733';
			}
			browseItem += '&nbsp;';
		}
		browseItem += '<span style="float:left">&nbsp;' + postAge + '&nbsp;</span>';
		browseItem += '<span style="width:50%;position:relative;float:left;overflow-x:auto;">'
		if(item.subreddit !== undefined && !item.subreddit.includes('u_') && item.subreddit.toUpperCase() != id.toUpperCase()){
			var sub = item.subreddit;
			browseItem += '<a href="#/r/' + sub + '" target="_blank">(' + sub + ')</a>';
			if(browser.isFavorite(sub)){
				browseItem += '&#9733';
			}
			browseItem += '&nbsp;';
		}
		browseItem += '</span>';
		browseItem += '</p>';
		browseItem += '<a href="#" class="nextItem ui-btn ui-corner-all ui-btn-inline">Next</a>';
		if(index > 0){
			browseItem += '<a href="#" class="backItem ui-btn ui-corner-all ui-btn-inline"><</a>';
		}
		browseItem += '</br>'

		var audioMuted = browser.getAudioMuted();
		var muted = audioMuted ? 'muted' : '';
		var itemType = '';
		
		if (item.domain == "v.redd.it" && item.secure_media) {
			itemType = "FullVideo";

			browseItem += `<video controls autoplay loop ` + (muted ? 'muted' : '') + ` class="itemImage">
			<source src="` + item.secure_media.reddit_video.fallback_url + `" type="video/mp4" />
			</video>`
		}
		else if(item.domain == "i.imgur.com" && item.url.includes('.gifv')){
			itemType = "FullVideo";

			browseItem += `<video controls autoplay loop ` + (muted ? 'muted' : '') + ` class="itemImage">
			<source src="` + item.preview.reddit_video_preview.fallback_url + `" type="video/mp4" />
			</video>`
		}
		else if (item.domain == "i.redd.it" || (item.domain == "i.imgur.com" && !item.url.includes('/a/'))) {
			itemType = "FullImage";
			browseItem += '<img class="itemImage" src="' + item.url + '"/>';
		}
		else if (item.media) {
			itemType = "CompactEmbed";
			var source = item.secure_media_embed.media_domain_url + '?responsive=true&is_nightmode=true';
			browseItem += '<iframe class="itemImage" height="512" width="100%" src="' + source + '" allowfullscreen="true" style="width: 100%; margin: 0px auto;"></iframe>';
		}
		else if (item.is_self) {
			itemType = "FullText";
			var html = item.selftext_html;
			browseItem += '<div id="textPost" class="post">';
			let txt = document.createElement("textarea");
		    txt.innerHTML = html;
			browseItem += txt.value;
			browseItem += '</div>'
		}
		else if(item.url.includes('gifs.com')){
			browseItem += '<iframe class="itemImage" height="512" width="100%" src="' + item.url + '" allowfullscreen="true" style="width: 100%; margin: 0px auto;"></iframe>';
		}
		/*else if (item.post_hint == 'image') {
			itemType = "FullImage";
			
		}*/
		else if (item.post_hint == 'link') {
			itemType = "CompactLink";
			browseItem += '<div id="linkPost" class="post">';
			browseItem += '<img src="' + item.thumbnail + '" class="itemImage"/><br/>';
			browseItem += '<a href="' + item.url + '" target="_blank">' + item.domain + '</a>';
			browseItem += '</div>';
		}	
		else if (item.url_overridden_by_dest.startsWith('https://www.reddit.com/gallery/') && item.gallery_data) {
			itemType = "FullGallery";
			var order = item.gallery_data.items.map(item => item.media_id);
			var items = order.map(id => item.media_metadata[id]);

			var images = items.map(item => ({
				src: item.s.u ? item.s.u.split("?")[0].replace("preview", "i") : item.s.gif
			}))

			browseItem += '<div id="browseGallery" class="gallery">';

			for(var i = 0; i < images.length; i++){
				browseItem += `
					<div class="gallery-item ` + (i == 0 ? 'active' : '') + `">
						<img src="` + images[i].src + `" class="itemImage">
					</div>
					<p>` + (i + 1) + `/` + images.length + ``
			}
				
			browseItem += '</div>';
			browseItem += '<a href="#" class="nextItem ui-btn ui-corner-all ui-btn-inline">Next</a>';
			if(index > 0){
				browseItem += '<a href="#" class="backItem ui-btn ui-corner-all ui-btn-inline"><</a>';
			}
		}
		else {
			itemType = 'unknown';
			browseItem += '<p>This item cannot be displayed. Please try viewing the source directly.</p>';
		}

		$('#app').html(browseItem).trigger('create');
	
		$('#subredditButton').click(function(){
			browser.displayList(id, sort, list, after);
		})

		if(itemType == "FullGallery"){
			$('#itemTitle').append(' [Gallery]').trigger('create');
		}
	
		$('.nextItem').click(function(){
			if(index + 1 >= list.length){
				var url = browser.getUrl(id, sort, after);
				browser.getSubmissions(url)
					.then((data) => {
						var concatenated = list.concat(data.posts);
						var last = concatenated[concatenated.length - 1].data.name;
						$.mobile.loading('hide');
						browser.displayItem(id, sort, concatenated, concatenated[index + 1].data.name, last);
					})
			}
			else{
				browser.displayItem(id, sort, list, list[index + 1].data.name, after);
			}
		})
	
		$('.backItem').click(function(){
			browser.displayItem(id, sort, list, list[index - 1].data.name, after);
		})
	}

	methods.getAge = function(timestamp){
		var d = new Date(timestamp * 1000);
		var now = new Date();
		var diff = now - d;
	
		var seconds = diff / 1000;
		if(seconds < 61){
			return Math.floor(seconds) + ' second' + (Math.floor(seconds) == 1 ? '' : 's')
		}
		var minutes = seconds / 60;
		if(minutes < 61){
			return Math.floor(minutes) + ' minute' + (Math.floor(minutes) == 1 ? '' : 's')
		}
		var hours = minutes / 60;
		if(hours < 25){
			return Math.floor(hours) + ' hour' + (Math.floor(hours) == 1 ? '' : 's')
		}
		var days = hours / 24;
		if(days < 32){
			return Math.floor(days) + ' day' + (Math.floor(days) == 1 ? '' : 's')
		}
		return d.toLocaleDateString();
	}

	methods.addFavorite = function(subreddit){
		var favorites = this.getFavorites();
		if(favorites.indexOf(subreddit) === -1 && subreddit !== '')
		{
			favorites.push(subreddit);
			favorites.sort();

			if (typeof (Storage) !== "undefined") {
				localStorage.setItem("favorites", JSON.stringify(favorites));
			}

			$('#favoriteButton').html(subreddit + ' &#9733');
			$('#favoriteButton').attr('onclick', 'browser.removeFavorite(\'' + subreddit + '\')');
		}
	}

	methods.getFavorites = function(){
		if (typeof (Storage) !== "undefined") {
			if(localStorage.getItem("favorites") !== null){
				var favorites = JSON.parse(localStorage.getItem("favorites"));
				return favorites;
			}
			return [];
		}
	}

	methods.isFavorite = function(subreddit){
		var favorites = this.getFavorites();
		return favorites.find(function(ele){return ele === subreddit.toLowerCase()})
	}

	methods.removeFavorite = function(subreddit){
		var favorites = this.getFavorites();
		favorites = favorites.filter(x => x !== subreddit);

		if (typeof (Storage) !== "undefined") {
			localStorage.setItem("favorites", JSON.stringify(favorites));
		}
	
		$('#favoriteButton').html(subreddit + ' &#9734');
		$('#favoriteButton').attr('onclick', 'browser.addFavorite(\'' + subreddit + '\')');
	}

	methods.setAudioMuted = function(audioMuted){
		if (typeof (Storage) !== "undefined") {
			localStorage.setItem("audioMuted", audioMuted);

			if(audioMuted){
				$('#audioMutedButton').html('&#128263;')
			}
			else{
				$('#audioMutedButton').html('&#128266;')
			}
		}
		else
		{
			$('#audioMutedButton').remove();
		}
	}

	methods.getAudioMuted = function(){
		if (typeof (Storage) !== "undefined") {
			if(localStorage.getItem("audioMuted") !== null){
				var audioMuted = localStorage.getItem("audioMuted")
				return audioMuted == 'true';
			}
			return true;
		}
	}

	return methods;
})();