var posts = [];
var after = '';

async function setup(id){
	var sort = 'hot';
	var url = browser.getUrl(id, sort);
	let response = await browser.getSubmissions(url);
	if (!response) return;

	posts = response.posts;
	after = response.after;

	browser.displayList(id, sort, posts, after);

	$('#favoritesButton').hide();
	$('#audioMutedButton').show();
}

const SubredditComponent = {
	render: (id) => {
		setup(id);
	}
} 

export { SubredditComponent };