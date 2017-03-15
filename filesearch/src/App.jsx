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
      searchResultActive: 0,
      settings: {
        interval: 5000
      }
    }
  }

  focusSearch() {
    this.inputElement.focus();
  }

  componentDidMount() {
    // react using synthetic event which mean that to stop keyboard event reach
    // notebook keyboard handler we have to stop it here.
    this.inputElement.onkeydown = (e) => {
      e.stopPropagation();
      this.keyPress(e);
    }

    // bind the ctrl+o keyboard to trigger the search
    var keyshortcuts = { 
      ctrlKey: 17, ctrlPressing: false,
      shiftKey: 16, shiftPressing: false,
      oKey: 79 
    }
    if (window.navigator.platform.indexOf('Mac') != -1) {
      keyshortcuts.ctrlKey = 91;
    }

    window.$(window.document).keydown((e) => {
      if (e.keyCode == keyshortcuts.ctrlKey) {
        keyshortcuts.ctrlPressing = true;
      }
      if (e.keyCode == keyshortcuts.shiftKey) {
        keyshortcuts.shiftPressing = true;
      }

      if (e.keyCode == keyshortcuts.oKey && keyshortcuts.ctrlPressing && keyshortcuts.shiftPressing) {
        this.focusSearch();
      }
    }).keyup((e) => {
      if (e.keyCode == keyshortcuts.ctrlKey) {
        keyshortcuts.ctrlPressing = false;
      }
      if (e.keyCode == keyshortcuts.shiftKey) {
        keyshortcuts.shiftPressing = false;
      }
    });

    // update the project structure
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
      var res = this.state.searchResults[this.state.searchResultActive],
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

    if (e.key === 'Escape') {
      window.$(this.inputElement).blur();
      this.setState({
        query: '',
        searchResults: [],
      });
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.setState({
        searchResultActive: Math.max(this.state.searchResultActive - 1, 0)
      });
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.setState({
        searchResultActive: Math.min(this.state.searchResultActive + 1, this.state.searchResults.length - 1)
      });
    }
  }

  search(e) {
    var newQuery = e.target.value,
        results  = [];

    if (newQuery.length > 1) {
      results = fuzzy.filter(newQuery.replace(/_/g, ' ').replace(/\./g, ' '), this.state.structures, {
        pre: '<b>', post: '</b>', extract: (el) => el.path.replace(/_/g, ' ').replace(/\./g, ' ')
      });
    }

    this.setState({
      query: newQuery,
      searchResults: results,
      searchResultActive: 0
    });
  }

  render() {
    var shouldOpenNewPage = this.isNotebookURI(window.location.pathname);

    var resultElements = this.state.searchResults.map((e, i) => {
      var href   = this.getFileOrFolderPath(e.original),
          target = shouldOpenNewPage ? '_blank' : '_self',
          className = 'list-group-item' + (this.state.searchResultActive == i ? ' active' : '');

      return <a key={e.original.path} className={className} href={href} target={target}>
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
               ref={(input) => { this.inputElement = input; }}
               value={this.state.query} onChange={this.search.bind(this)}
               />
        <div id='file-search-result' className='list-group'>
          {resultElements}
        </div>
      </div>
    );
  }
}

export default App;
