import { IDataWriter } from "../../../interfaces/IDataWriter";
import { SchemaContext } from "../../../types/ContextTypes";
import { MutationWriteTarget } from "../../../types/mutation/MutationWriteTargetTypes";

export class DataMutationWriter {

    constructor(
        private writer: IDataWriter,
        private contextResolver: (
            schemaName: string
        ) => Promise<SchemaContext>
    ) {}

    async save(
        targets: MutationWriteTarget[]
    ): Promise<void> {

        const grouped =
            new Map<
                string,
                MutationWriteTarget[]
            >();

        for (const target of targets) {

            const list =
                grouped.get(
                    target.schemaName
                ) ?? [];

            list.push(target);

            grouped.set(
                target.schemaName,
                list
            );
        }

        for (
            const [
                schemaName,
                schemaTargets
            ]
            of grouped
        ) {

            const context =
                await this.contextResolver(
                    schemaName
                );

            await this.writer.saveRecords(
                context,
                schemaTargets.map(
                    x => x.record
                )
            );
        }
    }
}