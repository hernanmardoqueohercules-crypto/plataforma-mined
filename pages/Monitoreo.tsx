import React from 'react';
import ResourceRepository from '../components/ResourceRepository';
import { Resource, User, Breadcrumb } from '../types';

interface PageProps {
    user: User;
    onProtectedAction: () => void;
    resources: Resource[];
    allResourcesForView: Resource[];
    onSave: (saveData: { resourceData: Omit<Resource, 'id' | 'modified' | 'modifiedBy'> & { id?: number } }) => void;
    onDelete: (resourceId: number) => void;
    canAddResources: boolean;
    onFileUpload: (file: File) => Promise<string>;
    isDriveAuthorized: boolean;
    breadcrumbs: Breadcrumb[];
    onFolderClick: (folderId: number) => void;
    onBreadcrumbClick: (folderId: number | null) => void;
    currentFolderId: number | null;
}

const Monitoreo: React.FC<PageProps> = (props) => {
    return (
        <div>
            <ResourceRepository 
                resources={props.resources} 
                allResourcesForView={props.allResourcesForView}
                user={props.user} 
                onProtectedAction={props.onProtectedAction}
                onSave={props.onSave}
                onDelete={props.onDelete}
                canAddResources={props.canAddResources}
                onFileUpload={props.onFileUpload}
                isDriveAuthorized={props.isDriveAuthorized}
                breadcrumbs={props.breadcrumbs}
                onFolderClick={props.onFolderClick}
                onBreadcrumbClick={props.onBreadcrumbClick}
                currentFolderId={props.currentFolderId}
            />
        </div>
    );
};

export default Monitoreo;