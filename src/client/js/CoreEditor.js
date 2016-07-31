import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';
import CustomActions from './customActions';
import CommentEnabler from './CommentEnabler.js';

import LinkUrlDialog from './LinkUrlDialog.js';

class CoreEditor extends React.Component {
    constructor(props) {
        super(props);
        var contentBlocks,mentions;
        var doc = this.props.doc;
        if (doc) {
            doc.toDraft();
            contentBlocks = doc.contentBlocks;
            mentions = doc.mentions;
        } else {
            contentBlocks = [];
            mentions = [];
        }
        this.state = {
            editorState: this.getEditorState(contentBlocks,mentions),
            showURLInput: false,
            isEditLink: false,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: '',
            saveRelativePath: props.saveRelativePath,
            editUrl: props.editUrl,
            author: props.author,
            commentID: this.props.commentID,
            doc:doc
        };
        this.handleKeyCommand   = this.handleKeyCommand.bind(this);
        this.toggleBlockType    = this.toggleBlockType.bind(this);
        this.toggleInlineStyle  = this.toggleInlineStyle.bind(this);
        this.toggleCustomAction = this.toggleCustomAction.bind(this);
        this.promptForLink      = this.promptForLink.bind(this);
        this.promptForEdit      = this.promptForEdit.bind(this);
        this.focus              = this.focus.bind(this);
        this.onChange           = this.onChange.bind(this);
        this.confirmLink        = this.confirmLink.bind(this);
        this.editLink           = this.editLink.bind(this);
        this.cancelLink         = this.cancelLink.bind(this);
        this.removeLink         = this.removeLink.bind(this);
    }
    onChange(editorState) {
        this.setState({
            editorState
        });
    }
    focus() {
        this.refs.editor.focus();
    }
    getEditorState(contentBlocks, mentions) {
        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: Link
        }]);
        let editorState = contentBlocks.length > 0 ? EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks), decorator) : EditorState.createEmpty(decorator);
        mentions.forEach((mention, i) => {
            const entityKey = Entity.create('LINK', 'MUTABLE', {
                linkTitle: mention.linkTitle,
                linkUrl: mention.linkUrl,
                linkDesc: mention.linkDesc,
                onLinkEdit: this.promptForEdit.bind(this)
            });
            const key = contentBlocks[mention.block].getKey();
            editorState = RichUtils.toggleLink(
                editorState,
                SelectionState.createEmpty(key).merge({
                    anchorOffset: mention.start,
                    focusKey: key,
                    focusOffset: mention.end
                }),
                entityKey
            );
        }); 
        return editorState;
    }
    promptForLink() {

        var title = this.getSelectedText();
        
        this.setState({
            showURLInput: 1,
            titleValue: title
        });
            
    }
    getSelectedText() {
        const {
            editorState
        } = this.state;
        var title = '';
        const selectionState = editorState.getSelection();
        const blockKey = selectionState.getAnchorKey();
        const contentBlocks = editorState.getCurrentContent().getBlocksAsArray();
        var start = selectionState.getStartOffset();
        var end = selectionState.getEndOffset();

         contentBlocks.forEach((block) => {
                if(block.key === blockKey){
                    title = block.text.slice(start, end);
                }
            });
         return title;
    }
    promptForEdit(titleValue, urlValue, descValue, linkEntityKey) {
        const {
            editorState
        } = this.state;
        this.setState({
            showURLInput: 1,
            isEditLink: 1,
            titleValue,
            linkEntityKey
        });
    }
    editLink(e) {
        e.preventDefault();
        const {
            titleValue, urlValue, descValue, linkEntityKey
        } = this.state;
        Entity.mergeData(linkEntityKey, {
            linkTitle: titleValue,
            linkUrl: urlValue,
            linkDesc: descValue
        });
        this.setState({
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    cancelLink(e) {
        e.preventDefault();
        this.setState({
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    removeLink(e) {
        e.preventDefault();
        const {
            linkEntityKey,
            editorState
        } = this.state;
        let _editorState;
        editorState.getCurrentContent().getBlockMap().map(block => {
            block.findEntityRanges(char => {
                let entityKey = char.getEntity();
                return !!entityKey && entityKey === linkEntityKey && Entity.get(entityKey).getType() === 'LINK';
            }, (anchorOffset, focusOffset) => {
                _editorState = RichUtils.toggleLink(
                    editorState,
                    SelectionState.createEmpty(block.getKey()).merge({
                        anchorOffset,
                        focusKey: block.getKey(),
                        focusOffset
                    }),
                    null
                );
            });
        });
        this.setState({
            editorState: _editorState || editorState,
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    confirmLink(entityKey) {

        
        const {
            editorState
        } = this.state;


      
        // const content = editorState.getCurrentContent();
        // const selection = editorState.getSelection();
        // const start = selection.getStartOffset();
        // const end = selection.getEndOffset();

        // const block = content.getBlockForKey(selection.getAnchorKey());
        // const word = block.getText();
        // const result = word.slice(this.state.lastOffset, selection.getEndOffset());
        // const newSelection = new SelectionState({
        //   anchorKey: block.getKey(),
        //   anchorOffset: start,
        //   focusKey: block.getKey(),
        //   focusOffset: end
        // });
        // const contentReplaced = Modifier.replaceText(
        //         content,
        //         newSelection,
        //         titleValue);
        // const editorStateModified = EditorState.push(
        //  editorState,
        //  contentReplaced,
        //  'replace-text'
        // );

        // this.setState({lastOffset: selection.getEndOffset(), editorState:editorStateModified});






        // const contentInserted = Modifier.insertText(
        //   editorState.getCurrentContent(),
        //   editorState.getSelection(),
        //   titleValue
        // );

        // const editorStateModified = EditorState.push(
        //  editorState,
        //  contentInserted,
        //  'insert-text'
        // );

        // this.setState({editorState:editorStateModified});





        let _editorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );
        this.setState({
            editorState: _editorState,
            showURLInput: false,
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    handleKeyCommand(command) {
        const {
            editorState
        } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }
    toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }
    toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }
    toggleCustomAction(action) {
        // this is the place where to pass arguments to custom actions
        CustomActions.toggleCustomAction(this.state.editorState, action, this.state.saveRelativePath, this.state.author,this.state.commentID,this.state.doc);
    }
    gotCommentID (id) {
        this.setState({
            commentID:id
        });
    }
    componentDidUpdate () {
        window.frameReady();
    }
    myKeyBindingFn(e) {
      if (e.keyCode === 13) {
        window.frameReady();
      }
      return getDefaultKeyBinding(e);
    }
    render() {
        const {
            editorState
        } = this.state;
        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'RichEditor-editor';
        var contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }
        
        return (
            <div>
                <div className="RichEditor-root">
                  <BlockStyleControls
                    editorState={editorState}
                    onToggle={this.toggleBlockType}
                    onLinkToggle={this.promptForLink}
                  />
                  <InlineStyleControls
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                  />
                  { !this.state.showURLInput ? null : 
                  
                  
                    <LinkUrlDialog
                        isEditLink={this.state.isEditLink} 
                        onCancelLink={this.cancelLink} 
                        onRemoveLink={this.removeLink} 
                        onEditLink={this.editLink} 
                        onConfirmLink={this.confirmLink}
                        titleValue={this.titleValue}/> 
                   }
                  <div className={className} onClick={this.focus}>
                    <Editor
                      blockStyleFn={getBlockStyle}
                      editorState={editorState}
                      handleKeyCommand={this.handleKeyCommand}
                      onChange={this.onChange}
                      placeholder="Enter text..."
                      ref="editor"
                      spellCheck={true}
                      keyBindingFn={this.myKeyBindingFn}
                    />
                  </div>
                </div>
                <CommentEnabler commentID={this.state.commentID} author={this.props.author} editUrl={this.state.editUrl} gotCommentID={this.gotCommentID.bind(this)}/>
                <button type="button" className="btn btn-default btn-sm" onClick={() => this._toggleCustomAction('saveas')}>
                    Save
                </button>
                <button type="button" className="btn btn-default btn-sm" onClick={() => this._toggleCustomAction('save')}>
                    Save as
                </button>
            </div>
        );
    }
}

CoreEditor.propTypes = {
    doc: React.PropTypes.object,
    saveRelativePath: React.PropTypes.string,
    editUrl: React.PropTypes.string,
    author: React.PropTypes.string,
    commentID: React.PropTypes.string
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'RichEditor-blockquote';
        default:
            return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = this.onToggle.bind(this);
    }
    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.style);
    }
    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }
        return (
            <span className={className} onMouseDown={this.onToggle}>
              {this.props.label}
            </span>
        );
    }
}

StyleButton.propTypes = {
    onToggle: React.PropTypes.func,
    style: React.PropTypes.string,
    active: React.PropTypes.bool,
    label: React.PropTypes.string
};


const BLOCK_TYPES = [
    {
        label: 'Header',
        style: 'header-two'
    }, {
        label: 'Blockquote',
        style: 'blockquote'
    }, {
        label: 'UL',
        style: 'unordered-list-item'
    }, {
        label: 'OL',
        style: 'ordered-list-item'
    }, {
        label: 'Link',
        style: 'link'
    }
];

const BlockStyleControls = (props) => {
    const {
        editorState
    } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();
    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) => {
                if (type.style === 'link') {
                    return (<StyleButton
                        key={type.label}
                        active={type.style === blockType}
                        label={type.label}
                        onToggle={props.onLinkToggle}
                        style={type.style}
                    />);
                } else {
                    return (<StyleButton
                        key={type.label}
                        active={type.style === blockType}
                        label={type.label}
                        onToggle={props.onToggle}
                        style={type.style}
                    />);
                }
            })}
          </div>
    );
};

BlockStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    onToggle: React.PropTypes.func,
    onLinkToggle: React.PropTypes.func
};

var INLINE_STYLES = [
    {
        label: 'Bold',
        style: 'BOLD'
    }, {
        label: 'Italic',
        style: 'ITALIC'
    }, {
        label: 'Underline',
        style: 'UNDERLINE'
    }, {
        label: 'Monospace',
        style: 'CODE'
    }
];

const InlineStyleControls = (props) => {
    let {
        editorState
    } = props;
    var currentStyle = editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {INLINE_STYLES.map(type =>
              <StyleButton
                key={type.label}
                active={currentStyle.has(type.style)}
                label={type.label}
                onToggle={props.onToggle}
                style={type.style}
              />
            )}
          </div>
    );
};

InlineStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    onToggle: React.PropTypes.func
};

class ActionButton extends React.Component {
    constructor() {
        super();
        this.onToggle = this.onToggle.bind(this);
    }
    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.action);
    };
    render() {
        let className = 'RichEditor-styleButton';
        return (
            <span className={className} onMouseDown={this.onToggle}>
              {this.props.label}
            </span>
        );
    }
}

ActionButton.propTypes = {
    onToggle: React.PropTypes.func,
    label: React.PropTypes.string,
    action: React.PropTypes.string
};

var CUSTOM_ACTIONS = [
    {
        label: 'Save',
        action: 'save'
    }, {
        label: 'Save As',
        action: 'saveas'
    }
];

const CustomActionControls = (props) => {
    return (
        <div className="RichEditor-controls">
            {CUSTOM_ACTIONS.map(type =>
              <ActionButton
                key={type.label}
                label={type.label}
                onToggle={props.onToggle}
                action={type.action}
              />
            )}
          </div>
    );
};

CustomActionControls.propTypes = {
    onToggle: React.PropTypes.func
};

function findLinkEntities(contentBlock, callback) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();
            return (
                !!entityKey &&
                Entity.get(entityKey).getType() === 'LINK'
            );
        },
        callback
    );
}


class Link extends React.Component {
    constructor(props) {
        super(props);
        const {
            linkTitle, linkUrl, linkDesc, onLinkEdit
        } = Entity.get(props.entityKey).getData();
        this.linkTitle = linkTitle;
        this.linkUrl = linkUrl;
        this.linkDesc = linkDesc;
        this.onLinkEdit = (e) => {
            e.preventDefault();
            onLinkEdit(this.linkTitle, this.linkUrl, this.linkDesc, props.entityKey);
        };
    }
    componentWillReceiveProps(props) {
        const {
            linkTitle, linkUrl, linkDesc, onLinkEdit
        } = Entity.get(props.entityKey).getData();
        this.linkTitle = linkTitle;
        this.linkUrl = linkUrl;
        this.linkDesc = linkDesc;
        this.onLinkEdit = (e) => {
            e.preventDefault();
            onLinkEdit(this.linkTitle, this.linkUrl, this.linkDesc, props.entityKey);
        };
    }
    render() {
        return (
            <a href={this.linkUrl} onClick={this.onLinkEdit}>
                {this.linkTitle}
            </a>
        );
    }
};

Link.propTypes = {
    entityKey: React.PropTypes.string,
    children: React.PropTypes.array
};

const styles = {
    root: {
        fontFamily: '\'Georgia\', serif',
        padding: 20,
        width: 600,
    },
    buttons: {
        marginBottom: 10,
    },
    linkTitleInputContainer: {
        marginBottom: 10,
    },
    linkTitleInput: {
        fontFamily: '\'Georgia\', serif',
        marginRight: 10,
        padding: 3,
    },
    editor: {
        border: '1px solid #ccc',
        cursor: 'text',
        minHeight: 80,
        padding: 10,
    },
    button: {
        marginTop: 10,
        textAlign: 'center',
    }
};


export default CoreEditor;