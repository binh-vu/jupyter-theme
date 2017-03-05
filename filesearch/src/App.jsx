import React, { Component } from 'react';
import { getProjectStructure } from './lib.jsx';
import fuzzy from 'fuzzy';
import './App.css';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      structures: [],
      query: '',
      searchResults: [],
      settings: {
        interval: 5000
      }
    }
  }

  componentDidMount() {
    getProjectStructure()
      .then((structures) => {
        this.setState({ structures: structures });
        this.regularUpdateProjectStructure(this.state.settings.interval);
      });
  }

  regularUpdateProjectStructure() {
    this.updateProjectStructureTimer = setTimeout(() => {
      getProjectStructure()
        .then((structures) => {
          this.setState({ structures: structures });
          
          this.regularUpdateProjectStructure(this.state.settings.interval);
        });
    }, this.state.settings.interval);
  }

  getFileOrFolderPath(e) {
    if (e.type === 'dir') {
      return '/tree' + e.path;
    }
    if (this.isNotebookURI(e.path)) {
      return '/notebooks' + e.path;
    }
    return '/edit' + e.path;
  }

  isNotebookURI(path) {
    var ext = path.substring(path.lastIndexOf('.'));
    return ext === '.ipynb';
  }

  keyPress(e) {
    if (e.key === 'Enter') {
      if (this.state.searchResults.length === 0) return;
      var res = this.state.searchResults[0],
          href = this.getFileOrFolderPath(res.original);

      if (this.isNotebookURI(window.location.pathname)) {
        // open new page
        window.open(href, '_blank');
      } else {
        // open in same page
        window.open(href, '_self');
      }

      return;
    }
  }

  search(e) {
    var newQuery = e.target.value,
        results  = [];

    if (newQuery.length > 1) {
      results = fuzzy.filter(newQuery, this.state.structures, {
        pre: '<b>', post: '</b>', extract: (el) => el.path
      });
    }

    this.setState({
      query: newQuery,
      searchResults: results
    });
  }

  render() {
    var shouldOpenNewPage = this.isNotebookURI(window.location.pathname);

    var resultElements = this.state.searchResults.map((e) => {
      var href   = this.getFileOrFolderPath(e.original),
          target = shouldOpenNewPage ? '_blank' : '_self';

      return <a key={e.original.path} className='list-group-item' href={href} target={target}>
        <div className='list-group-item-result'>
          <span>{e.score}</span>
        </div>
        <div className='list-group-item-file-name'>
          <h4 className='list-group-item-heading'>{e.original.name}</h4>
          <p className='list-group-item-text' dangerouslySetInnerHTML={{__html: e.string}}></p>
        </div>
      </a>;
    });

    return (
      <div id="file-search-app">
        <input id='file-search' className='form-control' placeholder='Enter file name...' 
               value={this.state.query} onChange={this.search.bind(this)} 
               onKeyPress={this.keyPress.bind(this)}
               />
        <div id='file-search-result' className='list-group'>
          {resultElements}
        </div>
      </div>
    );
  }
}

export default App;
