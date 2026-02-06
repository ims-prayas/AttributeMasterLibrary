export interface ParentAttribute {
  HasParent: boolean;
  ParentName: string;
  ParentValues: any[];
}

export interface AttributeValueList{
    AttributeListId: number;
    AttributeName: string;
    AttributeValue: string;
    ParentAttributeName: string;
    ParentAttributeValueName: string;
    ParentAttributeValueId: number;
}