function importFavorites(){
	var lines = $('#favoritesInput').val().split('\n');
	lines.forEach(fav => {
		browser.addFavorite(fav)
	})

	FavoritesComponent.render();
}

const FavoritesComponent = {
	render: () => {
		var favorites = browser.getFavorites();
		var favoritesHtml = '';
		var subredditFavs = favorites.filter(x => x.substring(0, 2) !== 'u/');
		var userFavs = favorites.filter(x => x.substring(0, 2) === 'u/');
		subredditFavs.forEach(subreddit =>
			favoritesHtml += '<p>' + subreddit + '</p>'
		)
		userFavs.forEach(user =>
			favoritesHtml += '<p>' + user + '</p>'
		)

		var section = `
			<div id="favorites">
				<textarea placeholder="favorites for import" id="favoritesInput" style="color:black;"></textarea>
				<button id="importButton" class="ui-btn ui-btn-corner-all ui-btn-inline">Import</button>
				` + favoritesHtml + `
			</div>
		`;
		$('#app').html(section).trigger('create');
		$('#importButton').click(function(){ importFavorites() });
	}
} 

export { FavoritesComponent };