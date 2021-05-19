const UserComponent = {
	render: (id, sort) => {
		var url = browser.getUrl('u/' + id);
		browser.getSubredditList(url, 'u/' + id).then(list => {
			browser.displayList('u/' + id, list, sort)
		});

		$('#favoritesButton').hide();
		$('#audioMutedButton').show();
	}
} 

export { UserComponent };