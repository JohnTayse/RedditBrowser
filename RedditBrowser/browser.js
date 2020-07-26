var browser = (function(){
	'use strict';

	var methods = {};

	methods.getUrl = function(id, sort, guid){
		var reddit = '';
		if(id.indexOf('u/') > -1){
			reddit = id
		}
		else
		{
			reddit = 'r/' + id
		}
	
		var baseUrl = 'https://www.reddit.com/' + reddit + '/';
		var simpleSorts = ['hot', 'new', 'top'];
		if(sort === undefined){
			baseUrl += '.rss';
		}
		else if(simpleSorts.includes(sort)){
			baseUrl += sort + '/.rss'
		}
		else{
			baseUrl += 'top/.rss?t=' + sort;
		}
	
		if(guid !== undefined){
			baseUrl += (baseUrl.includes('?') ? '&' : '?') + 'after=' + guid;
		}
	
		return baseUrl;
	}

	methods.getSubredditList = async function(url, id){
		$.mobile.loading('show');
		var feed = await feednami.load(url)
		var entries = browser.cleanList(feed.entries, id);
		return entries;
	}
	
	methods.getNextList = async function(id, sort, guid, list){
		var url = browser.getUrl(id, sort, guid);
		$.mobile.loading('show');
		var feed = await feednami.load(url)
		var entries = browser.cleanList(feed.entries, id);
		return browser.concatList(list, entries);
	}
	
	methods.getNextItemList = async function(id, sort, guid, list){
		var url = browser.getUrl(id, sort, guid);
		$.mobile.loading('show');
		var feed = await feednami.load(url)
		var entries = browser.cleanList(feed.entries, id);
		return browser.concatList(list, entries);
	}

	methods.cleanList = function(entries, id){
		return entries.filter(x => x.title.toLowerCase().indexOf('/' + id + ' on') === -1);
	}

	methods.displayList = function(id, list, sort){
		$('#subredditButton').remove();

		var browseList = '<section id="browseList" class="ui-grid-c">';
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
		browseList += '<option value="top">Top Today</option>';
		browseList += '<option value="week">Top This Week</option>';
		browseList += '<option value="month">Top This Month</option>';
		browseList += '<option value="year">Top This Year</option>';
		browseList += '<option value="all">Top All Time</option>';
		browseList += '</select><br/>';

		list.forEach(post => {
			var content = $.parseHTML(post.description);
			var imgs = $(content).find('img');
			if(imgs.length > 0){
				browseList += '<a id="' + post.guid + '" class="item ui-bar ui-bar-a">'
				browseList += '<p class="title clamp">' + post.title + '</p>';
				browseList += imgs[0].outerHTML;
				browseList += '</a>'
			}
		})
		browseList += '<br/><a href="#" id="nextButton" class="ui-btn ui-corner-all ui-btn-inline">Next</a>';
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
			browser.getSubredditList(url, id).then(list => {
				browser.displayList(id, list, sortSelected)
			});
		})

		$('#nextButton').click(function(){
			var guid = list[list.length - 1].guid;
			browser.getNextList(id, sort, guid, list).then(list => {
				browser.displayList(id, list, sort)
			});
		})
		$('.item').click(function(){
			browser.displayItem(id, list, sort, this.id);
		})
	}

	methods.displayItem = function(subreddit, subredditList, sort, id, isNavBack){
		var index = -1;
		var item = subredditList.find(function(ele, i){
			index = i;
			return ele.guid == id;
		});
		var content = $.parseHTML(item.description);
		var links = $(content).find('a').toArray();
		var image = links.find(function(ele){return ele.innerText === '[link]'});
		var source = links.find(function(ele){return ele.innerText === '[comments]'});
		var r = links.find(function(ele){return ele.innerText.indexOf('r/') > -1});
	
		$('#subredditButton').remove();
		$('#header').append('<a href="#" id="subredditButton" class="ui-btn ui-corner-all ui-btn-inline">' + subreddit + '</a>').trigger('create');
	
		var postAge = browser.getAge(item.date);
	
		var browseItem = '';
		
		browseItem += '<p class="title">' + item.title + '<br/>';
		browseItem += '<a href="' + source + '" target="_blank">(source)</a>&nbsp;';
		if(subreddit.indexOf('u/') === -1){
			browseItem += '<a href="#/user/' + item.author.replace('/u/', '') + '" target="_blank">(user)</a>&nbsp;';
		}
		if(r !== undefined){
			var sub = r.innerText.trim().replace('r/', '');
			browseItem += '<a href="#/subreddit/' + sub + '" target="_blank">(' + sub + ')</a>&nbsp;';
		}
		browseItem += '' + postAge + '</p>';
		browseItem += '<a href="#" id="nextItem" class="ui-btn ui-corner-all ui-btn-inline">Next</a>';
		if(index > 0){
			browseItem += '<a href="#" id="backItem" class="ui-btn ui-corner-all ui-btn-inline"><</a>';
		}
		browseItem += '</br>'
	
		if(image === undefined){
			if(isNavBack){
				var guid = subredditList[index - 1].guid;
				browser.displayItem(subreddit, subredditList, sort, guid, true);
			}
			else if(index + 1 >= subredditList.length){
				browser.getNextItemList(subreddit, sort, id, subredditList).then(list => {
					$.mobile.loading('hide');
					var next = list[list.findIndex((el) => el.guid === id) + 1];
					if(next !== undefined){
						var nextGuid = next.guid;
						browser.displayItem(subreddit, list, sort, nextGuid)
					} else {
						$('#nextItem').remove();
					}
				});
			}
			else{
				var guid = subredditList[index + 1].guid;
				browser.displayItem(subreddit, subredditList, sort, guid);
			}
		}
		else if(image.hostname === 'v.redd.it'){
			//browseItem += '<video muted preload="auto" autoplay="autoplay" loop="loop" class="itemImage" controls><source src="' + image.href + '/HLSPlaylist.m3u8" type="application/vnd.apple.mpegURL"></video>';
			browseItem += `<blockquote class="reddit-card" data-card-created="1595353215">
				<a href="`+ item.link + `">` + item.title + `</a>
				</blockquote>
				<script async src="//embed.redditmedia.com/widgets/platform.js" charset="UTF-8">
				</script>`
		}
		else if(image.hostname === 'i.imgur.com' && image.href.includes('.gifv')){
			browseItem += '<video muted preload="auto" autoplay="autoplay" loop="loop" class="itemImage" controls><source src="' + image.href.replace('.gifv', '.mp4') + '" type="video/mp4"></video>';
		}
		else if(image.hostname === 'i.redd.it' || image.hostname === 'i.imgur.com' || image.hostname === 'www.vidble.com'){
			browseItem += '<img class="itemImage" src="' + image.href + '"/>';
		}
		else if(image.hostname === 'imgur.com'){
			var url = image.href.split('/');
			var imgurid = url[url.length - 1];
			
			if(image.href.includes('/a/')){
				browseItem += '<blockquote class="imgur-embed-pub" lang="en" data-id="a/' + imgurid + '"><a href="//imgur.com/a/' + imgurid + '">' + item.title + '</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>';
			}
			else{
				browseItem += '<blockquote class="imgur-embed-pub" lang="en" data-id="' + imgurid + '"><a href="' + image.href + '">' + item.title + '</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>';
			}
		}
		else{
			var source = image.href;
			if(image.hostname === 'gfycat.com'){
				source = source.replace('gfycat.com/', 'gfycat.com/ifr/');
			}
			if(image.hostname.includes('hub.com')){
				source = source.replace('hub.com/', 'hub.com/embed/')
				var search = image.search.substring(1).split('&')
				var viewkey = search.find(x => x.includes('viewkey')).split('=')[1];
				source = source.substring(0, source.indexOf('embed/')) + 'embed/' + viewkey;
			}
			if(image.hostname.includes('gifs.com')){
				source = source.replace('/watch/', '/ifr/');
			}
	
			browseItem += '<iframe class="itemImage" height="512" width="100%" src="' + source + '" allowfullscreen="true" style="width: 100%; margin: 0px auto;"></iframe>';
		}
		$('#app').html(browseItem).trigger('create');
	
		$('#subredditButton').click(function(){
			browser.displayList(subreddit, subredditList, sort);
		})
	
		$('#nextItem').click(function(){
			if(index + 1 >= subredditList.length){
				browser.getNextItemList(subreddit, sort, id, subredditList).then(list => {
					$.mobile.loading('hide');
					var next = list[list.findIndex((el) => el.guid === id) + 1];
					if(next !== undefined){
						var nextGuid = next.guid;
						browser.displayItem(subreddit, list, sort, nextGuid)
					} else {
						$('#nextItem').remove();
					}
				});
			}
			else{
				var guid = subredditList[index + 1].guid;
				browser.displayItem(subreddit, subredditList, sort, guid);
			}
		})
	
		$('#backItem').click(function(){
			var guid = subredditList[index - 1].guid;
			browser.displayItem(subreddit, subredditList, sort, guid, true);
		})
	}

	methods.getAge = function(timestamp){
		var d = new Date(timestamp);
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
	
	methods.concatList = function(currentList, newList){
		var list = currentList.concat(newList);
		list = list.filter((elem, index, self) => self.findIndex((t) => {return t.guid === elem.guid}) === index);
		return list;
	}

	methods.addFavorite = function(subreddit){
		var favorites = this.getFavorites();
		if(favorites.indexOf(subreddit) === -1)
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
		return favorites.find(function(ele){return ele === subreddit})
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

	return methods;
})();