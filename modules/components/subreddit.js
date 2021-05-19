const SubredditComponent = {
	render: (id, sort) => {
		var url = browser.getUrl(id);
		browser.getSubredditList(url, id).then(list => {
			browser.displayList(id, list, sort)
		});

		$('#favoritesButton').hide();
		$('#audioMutedButton').show();
	}
} 

export { SubredditComponent };