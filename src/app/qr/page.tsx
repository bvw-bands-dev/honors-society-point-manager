/*
 * Blue Flame's Honors Society Point Manager
 * Copyright (C) 2026 Blue Flame
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import QRCode from "react-qr-code";
import { Print } from "./page.client";

export default async function QRPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-24 landscape:flex-row">
      <div className="min-w-[30ch] p-16 text-center font-mono text-3xl text-gray-500 landscape:hidden print:text-gray-300">
        {(await searchParams)?.label ?? ""}
      </div>
      <QRCode
        value={(await searchParams)?.value ?? (await searchParams)?.code ?? ""}
        className="h-full min-h-[20rem] w-full min-w-[20rem] p-16 print:size-24 print:p-0"
      />
      <div className="p-16 font-mono text-6xl text-black">
        {(await searchParams)?.code ?? ""}
      </div>
      {((await searchParams)?.print ?? "") == "true" && <Print />}
    </div>
  );
}
