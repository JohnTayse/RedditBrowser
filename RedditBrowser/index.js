var subreddit = '';
var subredditList = [];
var sort = '';
var favorites = [];

$(function()
{
    $('#homeButton').click(function(){
        subreddit = '';
        subredditList = [];
        sort = '';
        $('#subredditInput').val('');
        $('#subredditButton').remove();
        history.pushState("", document.title, window.location.pathname + window.location.search);
        $('#entersubreddit').show();
        $('#browseList').hide();
        $('#browseItem').hide();
    })

    $('#browseButton').click(function(){
        browse();
    })

    $('#entersubreddit').hide();
    $('#browseList').hide();
    $('#browseItem').hide();

    loadFavorites();

    subreddit = window.location.hash;
    if(subreddit.length === 0){
        $('#entersubreddit').show();
    }
    else{
        $('#browseList').show();
        subreddit = subreddit.substring(1);
        getSubredditList();
    }
});

function browse(){
    subreddit = $('#subredditInput').val().toLowerCase();
    if(subreddit !== ''){
        $('#entersubreddit').hide();
        $('#browseList').show();
        window.location.hash = subreddit;
        getSubredditList();
    }
}

function getSubredditList(){
    $('#browseList').html('');
    $.mobile.loading('show');
    var url = getUrl('');
    feednami.load(url)
    .then(feed => {
        subredditList = feed.entries;
        displayList();
    })
}

function getNextList(guid){
    $.mobile.loading('show');
    var url = getUrl(guid);
    feednami.load(url)
    .then(feed => {
        concatList(feed.entries);
        displayList();
    })
}

function getNextItemList(guid){
    $.mobile.loading('show');
    var url = getUrl(guid); 
    feednami.load(url)
    .then(feed => {
		concatList(feed.entries);
		var nextGuid = subredditList[subredditList.findIndex((el) => el.guid === guid) + 1].guid;
        displayItem(nextGuid);
    })
}

function concatList(newList){
	subredditList = subredditList.concat(newList);
	subredditList = subredditList.filter((elem, index, self) => self.findIndex((t) => {return t.guid === elem.guid}) === index);
}

function getUrl(guid){
    var reddit = '';
    if(subreddit.indexOf('u/') > -1){
        reddit = subreddit
    }
    else
    {
        reddit = 'r/' + subreddit
    }

    var baseUrl = 'https://www.reddit.com/' + reddit + '/';
    var simpleSorts = ['hot', 'new', 'top'];
    if(sort === ''){
        baseUrl += '.rss';
    }
    else if(simpleSorts.includes(sort)){
        baseUrl += sort + '/.rss'
    }
    else{
        baseUrl += 'top/.rss?t=' + sort;
    }

    if(guid !== ''){
        baseUrl += (baseUrl.includes('?') ? '&' : '?') + 'after=' + guid;
    }

    return baseUrl;
}

function displayList(){
    var browseList = ''
    var isFavorite = favorites.find(function(ele){return ele === subreddit});
    if(isFavorite !== undefined){
        browseList += '<button id="favoriteButton" onclick="removeFavorite()" class="ui-btn ui-corner-all ui-btn-inline">' + subreddit + ' &#9733</button>';
    }
    else {
        browseList += '<button id="favoriteButton" onclick="addFavorite()" class="ui-btn ui-corner-all ui-btn-inline">' + subreddit + ' &#9734</button>';
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
    

    $.each(subredditList, function(i){
        var content = $.parseHTML(this.description);
        var imgs = $(content).find('img');
        if(imgs.length > 0){
            browseList += '<a id="' + this.guid + '" class="item ui-bar ui-bar-a">'
            browseList += '<p class="title clamp">' + this.title + '</p>';
            browseList += imgs[0].outerHTML;
            browseList += '</a>'
        }
    })
    browseList += '<br/><a href="#" id="nextButton" class="ui-btn ui-corner-all ui-btn-inline">Next</a>';
    $('#browseList').attr('class', 'ui-grid-c');
    $('#browseList').html(browseList).trigger('create');

    if(sort !== ''){
        var el = $('#sortSelect');
        el.val(sort).attr('selected', true).siblings('option').removeAttr('selected');
        el.selectmenu("refresh", true);
    }

    $.mobile.loading('hide');

    $('#sortSelect').on('change', function(){
        sort = $('#sortSelect').val();
        getSubredditList();
    })

    $('#nextButton').click(function(){
        getNextList(subredditList[subredditList.length - 1].guid);
    })
    $('.item').click(function(){
        $('#browseList').hide();
        displayItem(this.id);
    })
}

function displayItem(id){
    var index = -1;
    var item = subredditList.find(function(ele, i){
        index = i;
        return ele.guid == id;
    });
    var content = $.parseHTML(item.description);
    var links = $(content).find('a').toArray();
    var image = links.find(function(ele){return ele.innerText === '[link]'});
    var source = links.find(function(ele){return ele.innerText === '[comments]'});

    $('#subredditButton').remove();
    $('#header').append('<a href="#" id="subredditButton" class="ui-btn ui-corner-all ui-btn-inline">r/' + subreddit + '</a>').trigger('create');

    var postAge = getAge(item.date);

    var browseItem = '';
    
    browseItem += '<p class="title">' + item.title + '<br/>';
    browseItem += '<a href="' + source + '" target="_blank">(source)</a>&nbsp;' + postAge + '</p>';
    browseItem += '<a href="#" id="nextItem" class="ui-btn ui-corner-all ui-btn-inline">Next</a>';
    if(index > 0){
        browseItem += '<a href="#" id="backItem" class="ui-btn ui-corner-all ui-btn-inline"><</a><br/>';
    }

    if(image.hostname === 'v.redd.it'){
        browseItem += '<video muted preload="auto" autoplay="autoplay" loop="loop" class="itemImage" controls><source src="' + image.href + '/HLSPlaylist.m3u8" type="application/vnd.apple.mpegURL"></video>';
    }
    if(image.hostname === 'i.imgur.com' && image.href.includes('.gifv')){
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

    $('#browseItem').show();
    $('#browseItem').html(browseItem).trigger('create');

    $.mobile.loading('hide');

    $('#subredditButton').click(function(){
        $('#browseItem').hide();
        $('#browseList').show();
        $('#subredditButton').remove();
        $('#browseItem').html('');
        displayList();
    })

    $('#nextItem').click(function(){
        if(index + 1 >= subredditList.length){
            getNextItemList(id);
        }
        else{
            var guid = subredditList[index + 1].guid;
            displayItem(guid);
        }
    })

    $('#backItem').click(function(){
        var guid = subredditList[index - 1].guid;
        displayItem(guid);
    })
}

function getAge(timestamp){
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

function loadFavorites(){
    if (typeof (Storage) !== "undefined") {
        if(localStorage.getItem("favorites") !== null){
            favorites = JSON.parse(localStorage.getItem("favorites"));
            favorites.sort();
            displayFavorites();
        }
    } else {
        if (localstoragealerted !== true) {
            alert('Local storage not available. Sessions will not be saved.');
            localstoragealerted = true;
        }
    }
}

function addFavorite(){
    favorites.push(subreddit);
    favorites.sort();

    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    } else {
        if (localstoragealerted !== true) {
            alert('Local storage not available. Sessions will not be saved!');
            localstoragealerted = true;
        }
    }

    $('#favoriteButton').html(subreddit + ' &#9733');
    $('#favoriteButton').attr('onclick', 'removeFavorite()');
    displayFavorites();
}

function removeFavorite(){
    favorites = favorites.filter(x => x !== subreddit);

    if (typeof (Storage) !== "undefined") {
        localStorage.setItem("favorites", JSON.stringify(favorites));
    } else {
        if (localstoragealerted !== true) {
            alert('Local storage not available. Sessions will not be saved!');
            localstoragealerted = true;
        }
    }

    $('#favoriteButton').html(subreddit + ' &#9734');
    $('#favoriteButton').attr('onclick', 'addFavorite()');
    displayFavorites();
}

function displayFavorites(){
	var favoritesHtml = '';
	var subredditFavs = favorites.filter(x => x.substring(0, 2) !== 'u/');
	var userFavs = favorites.filter(x => x.substring(0, 2) === 'u/');
    $.each(subredditFavs, function(){
        favoritesHtml += '<button onclick="$(\'#subredditInput\').val(\'' + this + '\'); browse();" class="ui-btn ui-btn-corner-all ui-btn-inline">' + this + '</button><br/>';
	})
	$.each(userFavs, function(){
        favoritesHtml += '<button onclick="$(\'#subredditInput\').val(\'' + this + '\'); browse();" class="ui-btn ui-btn-corner-all ui-btn-inline">' + this + '</button><br/>';
    })
    $('#favorites').html(favoritesHtml).trigger('create');
}