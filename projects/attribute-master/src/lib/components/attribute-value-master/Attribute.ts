export interface ParentAttribute {
  HasParent: boolean;
  ParentName: string;
  ParentValues: any[];
}

export interface AttributeValueList{
    AttributeListId: number;
    AttributeName: string;
    AttributeValue: string;
    AttributeValueId?: number;
    ParentAttributeName: string;
    ParentAttributeValueName?: string;
    ParentAttributeValueId?: number;
}