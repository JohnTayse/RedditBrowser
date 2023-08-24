var posts = [];
var after = '';

async function setup(id){
	var sort = 'hot';
	var url = browser.getUrl('user/' + id, sort);
	let response = await browser.getSubmissions(url);
	if (!response) return;

	posts = response.posts;
	after = response.after;

	browser.displayList('user/' + id, sort, posts, after);

	$('#favoritesButton').hide();
	$('#audioMutedButton').show();
}

const UserComponent = {
	render: (id) => {
		setup(id);
	}
} 

export { UserComponent }