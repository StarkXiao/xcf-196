export class CompleteFamilyTaskDto {
  completedBy: 'user' | 'partner';
  completionNote?: string;
  completionPhotos?: string[];
}

export class VerifyFamilyTaskDto {
  verifiedBy: 'user' | 'partner';
}

export class AssignFamilyTaskDto {
  assignedTo: 'user' | 'partner' | 'both';
}
