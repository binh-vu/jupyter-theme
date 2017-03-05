var $ = window.$;

// retrieve project structures 
export function getProjectStructure() {
	return $.ajax({
		url: "/api/project_structures",
		method: 'GET',
		contentType: 'application/json'
	})
	.then((result) => {
		return result.map((e) => {
			e.name = e.path.split('/')
			e.name = e.name[e.name.length - 1];
			return e;
		});
	});
}