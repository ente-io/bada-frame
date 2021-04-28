import { SetDialogMessage } from 'components/MessageDialog';
import { ListGroup, Popover } from 'react-bootstrap';
import {
    Collection,
    deleteCollection,
    renameCollection,
} from 'services/collectionService';
import { getSelectedCollection } from 'utils/collection';
import constants from 'utils/strings/constants';
import { SetCollectionNamerAttributes } from './CollectionNamer';
import LinkButton from './LinkButton';

interface Props {
    syncWithRemote: () => Promise<void>;
    setCollectionNamerAttributes: SetCollectionNamerAttributes;
    collections: Collection[];
    selectedCollectionID: number;
    setDialogMessage: SetDialogMessage;
    showCollectionShareModal: () => void;
}
const CollectionOptions = (props: Props) => {
    const collectionRename = async (
        selectedCollection: Collection,
        newName: string
    ) => {
        if (selectedCollection.name !== newName) {
            await renameCollection(selectedCollection, newName);
            props.syncWithRemote();
        }
    };
    const showRenameCollectionModal = () => {
        props.setCollectionNamerAttributes({
            title: constants.RENAME_COLLECTION,
            buttonText: constants.RENAME,
            autoFilledName: getSelectedCollection(
                props.selectedCollectionID,
                props.collections
            )?.name,
            callback: collectionRename.bind(
                null,
                getSelectedCollection(
                    props.selectedCollectionID,
                    props.collections
                )
            ),
        });
    };
    const MenuLink = (props) => (
        <LinkButton
            style={{ fontSize: '14px', fontWeight: 700, padding: '8px 1em' }}
            {...props}
        >
            {props.children}
        </LinkButton>
    );

    const MenuItem = (props) => (
        <ListGroup.Item
            style={{
                background: '#282828',
                padding: 0,
            }}
        >
            {props.children}
        </ListGroup.Item>
    );
    return (
        <Popover id="collection-options" style={{ borderRadius: '10px' }}>
            <Popover.Content style={{ padding: 0, border: 'none' }}>
                <ListGroup style={{ borderRadius: '8px' }}>
                    <MenuItem>
                        <MenuLink onClick={showRenameCollectionModal}>
                            {constants.RENAME}
                        </MenuLink>
                    </MenuItem>
                    <MenuItem>
                        <MenuLink onClick={props.showCollectionShareModal}>
                            {constants.SHARE}
                        </MenuLink>
                    </MenuItem>
                    <MenuItem>
                        <MenuLink
                            variant="danger"
                            onClick={() => {
                                props.setDialogMessage({
                                    title: constants.CONFIRM_DELETE_COLLECTION,
                                    content: constants.DELETE_COLLECTION_MESSAGE(),
                                    staticBackdrop: true,
                                    proceed: {
                                        text: constants.DELETE_COLLECTION,
                                        action: deleteCollection.bind(
                                            null,

                                            props.selectedCollectionID,

                                            props.syncWithRemote
                                        ),
                                        variant: 'danger',
                                    },
                                    close: {
                                        text: constants.CANCEL,
                                    },
                                });
                            }}
                        >
                            {constants.DELETE}
                        </MenuLink>
                    </MenuItem>
                </ListGroup>
            </Popover.Content>
        </Popover>
    );
};

export default CollectionOptions;