export type View = 'monitoreo' | 'supervision' | 'centros-escolares';

export type ResourceType = 'PDF' | 'Documento' | 'Hoja de cálculo' | 'Carpeta' | 'Enlace';

export type Resource = {
  id: number;
  name: string;
  type: ResourceType;
  modified: string;
  modifiedBy: string;
  isProtected?: boolean;
  url?: string;
  parentId: number | null; // null para la raíz
};

export type User = {
  name: string;
  email: string;
  picture: string;
} | null;

export type Theme = 'light' | 'dark';

export type Breadcrumb = {
  id: number | null;
  name: string;
};
