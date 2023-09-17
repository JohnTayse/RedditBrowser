function browse(){
	var id = $('#idInput').val().toLowerCase();
	if(id.indexOf('u/') > -1){
		window.location = '#/user/' + id.replace('u/', '');
	}
	else if(id.indexOf('user/') > -1){
		window.location = '#/' + id;
	}
	else
	{
		window.location = '#/r/' + id;
	}
}

const HomeComponent = {
	render: () => {
		$('#subredditButton').remove();

		var favorites = browser.getFavorites();
		var favoritesHtml = '';
		var subredditFavs = favorites.filter(x => x.substring(0, 2) !== 'u/' && x.substring(0, 5) !== 'user/');
		var userFavs = favorites.filter(x => x.substring(0, 2) === 'u/' || x.substring(0, 5) === 'user/');
		subredditFavs.forEach(subreddit =>
			favoritesHtml += '<a href="#/r/' + subreddit + '" class="ui-btn ui-btn-corner-all ui-btn-inline">' + subreddit + '</a></br>'
		)
		userFavs.forEach(user =>
			favoritesHtml += '<a href="#/' + user.replace('u/', 'user/') + '" class="ui-btn ui-btn-corner-all ui-btn-inline">' + user + '</a></br>'
		)

		var section = `
			<div id="browse">
				<input type="text" placeholder="r/ or u/" id="idInput"/>
				<button id="browseButton" class="ui-btn ui-btn-corner-all ui-btn-inline">Browse</button>
				<div id="favorites">` + favoritesHtml + `</div>
			</div>
		`;
		$('#app').html(section).trigger('create');
		$('#browseButton').click(function(){ browse() });

		$('#favoritesButton').show();
		$('#audioMutedButton').show();
		
		$(document).on('keypress',function(e) {
			if(e.which == 13) {
				browse();
			}
		});
	}
} 

export { HomeComponent };