import * as React from 'react';

import { TreeView } from './widgets/tree-view/TreeView';
import { AppContext } from './state/AppContext';
import { updateGrammarTree, hoverGrammarNode, unhoverGrammarNode, selectGrammarNode } from './state/AppActions';
import { callback } from './react/hooks';
import { AppActions } from './state/AppReducer';
import { TreeViewModel } from './widgets/tree-view/TreeViewState';
import { GrammarTree } from './domain/grammar/Grammar';
import { ValueEditorHeader } from './editor/ValueEditorHeader';

// const idMap = new WeakMap<GrammarTree, string>();

export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    const onOver = onOverCallback(dispatch);
    const onOut = onOutCallback(dispatch);
    const onSelect = onSelectCallback(dispatch);
    const renderHeader = renderHeaderCallback(state.availableCodecs, dispatch);
    // const grammar = state.grammar2;

    // if (grammar != null) {
    //     // return <TreeView
    //     //             renderHeader={renderHeader}
    //     //             renderBody={renderEditor}
    //     //             onOver={onHover}
    //     //             onOut={onOut}
    //     //             onSelect={onSelect}
    //     //             root={grammar.definition.root}
    //     //     ></TreeView>
    // } else {
    //     return <div>No data</div>;
    // }
    
    return <TreeView 
            state={state.grammarTree} 
            onChange={(t) => dispatch(updateGrammarTree(t))}
            renderHeader={renderHeader}
            onOver={onOver}
            onOut={onOut}
            onSelect={onSelect} />;
}

const onOverCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(hoverGrammarNode(node.data)));
const onOutCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(unhoverGrammarNode(node.data)));
const onSelectCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(selectGrammarNode(node.data)));

// const onChangeCallback = callback((grammar: Grammar | null, dispatch: React.Dispatch<AppActions>, fileData: Uint8Array | null) =>
//     (syntheticRoot: AnyElement) => {
//         if (grammar == null) {
//             throw new Error('Grammar was null for some reason');
//         }
//         if (!('content' in syntheticRoot) || syntheticRoot.content == null) {
//             throw new Error('no content in root');
//         }
//         console.log('changed');
//         const newGrammar = {
//             ...grammar,
//             content: syntheticRoot.content
//         };
//         // dispatch(loadGrammar(newGrammar));
//         if (fileData != null) {
//             setImmediate(() => {
//                 const parser = new Parser(newGrammar, fileData);
//                 const tree = parser.parse();
//                 dispatch(loadParseTree(tree));
//             })
//         }
//     }
// );

// function computeSelectedNodes(abt: AbtRoot | null, selectedNodes: number[]) {
//     return () => {
//         if (abt == null) {
//             return [];
//         }
//         const nodes = dumbFindNodes(abt, selectedNodes);

//         return nodes.map(n => identifyNode(n.origin));
//     };
// }

// function renderEditor(node: GrammarTree) {
//     switch (node.type) {
//         case 'repeat':
//             return <div style={{
//                 padding: "0 10px"
//             }}>
//                 repeat until:
//                 <div style={{
//                         border: "1px #1a1a1a solid",
//                         minHeight: "100px",
//                         padding: "3px"
//                 }}>
//                     {/* <TreeView
//                         root={makeSyntheticRoot(node.until)}
//                         identify={identifyNode}
//                         renderHeader={renderHeader}
//                         renderBody={renderEditor}
//                         getChildren={getNodeChildren}
//                         setChild={setNodeChild}></TreeView> */}
//                 </div>
//             </div>;
//         case 'if':
//             return <div style={{
//                 padding: "0 10px"
//             }}>
//                 <div>if <TextInput value={node.condition}/></div>
//                 { node.children != null ? <div>
//                     then:
//                     <div style={{
//                             border: "1px #1a1a1a solid",
//                             minHeight: "100px",
//                             padding: "3px"
//                     }}>
//                         {/* <TreeView
//                             root={makeSyntheticRoot(node.then)}
//                             identify={identifyNode}
//                             renderHeader={renderHeader}
//                             renderBody={renderEditor}
//                             hoveredNodes={hoveredNodes}
//                             selectedNodes={selectedNodes}
//                             onOver={onHover}
//                             onSelect={onSelect}
//                             getChildren={getNodeChildren}
//                             setChild={setNodeChild}></TreeView> */}
//                     </div>
//                 </div> : undefined }
//             </div>;
//     }
//     return undefined;
// }

// const makeAdapter = memo((tree: GrammarUIStateTree | null) => () => {
//     if (tree == null) {
//         return null;
//     }
//     return (): TreeViewAdapter<AnyElement> => ({
//         useChildren: makeAdapterChildren(tree.children),
//         isHovered: tree.hovered,
//         isSelected: false,
//         node: tree.node
//     });
// });

// const makeChildAdapter = memo((tree: GrammarUIStateTree) => () => {
//     return (): TreeViewAdapter<AnyElement> => ({
//         useChildren: makeAdapterChildren(tree.children),
//         isHovered: tree.hovered,
//         isSelected: false,
//         node: tree.node
//     });
// });

// const makeAdapterChildren = callback((children: GrammarUIStateTree[]) => () => children.map(n => makeChildAdapter(n)));

// function setNodeChild(parent: AnyElement, child: AnyElement, i: number): AnyElement {
//     if ('content' in parent) {
//         if (parent.content == null || parent.content.length <= i) {
//             console.error('Cannot delete child in empty array');
//             return parent;
//         }
//         return {
//             ...parent,
//             content: [ ...parent.content.slice(0, i), child, ...parent.content.slice(i + 1)]
//         };
//     }

//     switch (parent.type) {
//         case 'repeat':
//             return {
//                 ...parent,
//                 do: [ ...parent.do.slice(0, i), child, ...parent.do.slice(i + 1)]
//             };
//     }

//     return parent;
// }


// TODO: Create an adapter for each node type to render the title and the editor for that node type.
const renderHeaderCallback = callback((availableCodecs: string[], dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => {
    switch (node.data.type) {
        case 'value':
            return <ValueEditorHeader value={node.data} availableCodecs={availableCodecs} dispatch={dispatch}></ValueEditorHeader>
        default:
            return node.data.ref != null ? node.data.ref : `<${node.data.type}>`;
    }
});

// function identifyNode(node: GrammarTree) {
//     let id = idMap.get(node);
//     if (id == null) {
//         id = `${uniqId()}`
//         idMap.set(node, id);
//     }
//     return `${id}`;
// }