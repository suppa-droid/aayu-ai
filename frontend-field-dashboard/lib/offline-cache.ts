import { OfflineDB, DraftCitizen } from './offline-db';

export class OfflineStorageManager {
  static async saveDraftCitizen(citizenData: any): Promise<number> {
    return await OfflineDB.saveDraftCitizen(citizenData);
  }

  static async getDraftCitizens(): Promise<DraftCitizen[]> {
    return await OfflineDB.getDraftCitizens();
  }

  static async removeDraftCitizen(id: number): Promise<void> {
    return await OfflineDB.deleteDraftCitizen(id);
  }

  static async clearDrafts(): Promise<void> {
    return await OfflineDB.clearDraftCitizens();
  }

  static async syncOfflineData() {
    return await OfflineDB.syncAllDrafts();
  }
}
